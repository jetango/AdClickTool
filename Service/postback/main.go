package main

import (
	"AdClickTool/Service/db"
	"flag"
	"fmt"
	"net/http"

	"AdClickTool/Service/common"
	"AdClickTool/Service/config"
	"AdClickTool/Service/gracequit"
	"AdClickTool/Service/log"
	"AdClickTool/Service/servehttp"
	"AdClickTool/Service/tracking"
	"AdClickTool/Service/units"
	"AdClickTool/Service/units/blacklist"
	"AdClickTool/Service/units/user"
	"time"
)

func main() {
	help := flag.Bool("help", false, "show help")
	flag.Parse()
	if *help {
		flag.PrintDefaults()
		return
	}

	if err := config.LoadConfig(true); err != nil {
		panic(err.Error())
	}

	logAdapter := config.String("LOG", "adapter")
	logConfig := config.String("LOG", "jsonconfig")
	logAsync := config.Bool("LOG", "async")
	if logAdapter == "" {
		logAdapter = "console"
	}
	if logConfig == "" {
		logConfig = `{"level":7}`
	}
	log.Init(logAdapter, logConfig, logAsync)
	defer func() {
		log.Flush()
	}()

	// 启动保存协程
	gracequit.StartGoroutine(func(c gracequit.StopSigChan) {
		tracking.Saving(db.GetDB("DB"), c)
	})

	// 启动Conversion保存
	gracequit.StartGoroutine(func(c gracequit.StopSigChan) {
		tracking.SavingConversions(db.GetDB("DB"), c)
	})

	// 启动汇总协程
	gracequit.StartGoroutine(func(c gracequit.StopSigChan) {
		secondsAdStatis := config.Int("TRACKING", "adstatis-interval")
		interval := time.Duration(secondsAdStatis) * time.Second
		if interval == 0 {
			log.Warnf("config: TRACKING:adstatis-interval not found. Using default interval: 10 minutes")
			interval = 10 * 60 * time.Second
		}
		tracking.Gathering(c, interval)
	})

	secondsIpReferrerDomain := config.Int("TRACKING", "ip-interval")
	interval := time.Duration(secondsIpReferrerDomain) * time.Second
	if interval == 0 {
		log.Warnf("config: TRACKING:ip-interval not found. Using default interval: 10 minutes")
		interval = 10 * 60 * time.Second
	}

	// 启动AdIPStatis表的汇总协程
	tracking.InitIPGatherSaver(&gracequit.G, db.GetDB("DB"), interval)

	// 启动AdReferrerStatis表的汇总协程
	tracking.InitRefGatherSaver(&gracequit.G, db.GetDB("DB"), interval)

	// 启动AdReferrerDomainStatis表的汇总协程
	tracking.InitDomainGatherSaver(&gracequit.G, db.GetDB("DB"), interval)

	// redis 要能够连接
	redisClient := db.GetRedisClient("MSGQUEUE")
	if redisClient == nil {
		log.Errorf("Connect redis server failed.")
		return
	}
	log.Debugf("Connect redis success: redisClient:%p", redisClient)

	collector := new(user.CollectorCampChangedUsers)
	collector.Start()
	if err := units.Init(); err != nil {
		panic(err.Error())
	}
	collector.Stop()
	reloader := new(user.Reloader)
	go reloader.Running()
	log.Infof("collected users:%+v", collector.Users)
	log.Debugf("redisClient:%p", db.GetRedisClient("MSGQUEUE"))
	for _, uid := range collector.Users {
		user.ReloadUser(uid)
	}
	for _, uid := range collector.BlacklistUsers {
		blacklist.ReloadUserBlacklist(uid)
	}

	http.HandleFunc("/", Status)
	http.HandleFunc(config.String("DEFAULT", "s2spostback"), OnS2SPostback)
	http.HandleFunc(config.String("DEFAULT", "conversionpixelurl"), OnConversionPixel)
	http.HandleFunc(config.String("DEFAULT", "conversionscripturl"), OnConversionScript)

	log.Error(StartServe())

	log.Infof("stopping background goroutines...")
	gracequit.StopAll()
	log.Infof("background goroutines stopped")
}

func StartServe() error {
	reqServer := &http.Server{Addr: ":" + config.GetPostbackPort(), Handler: http.DefaultServeMux}
	log.Info("Start listening postback at", config.GetPostbackPort())
	return servehttp.Serve(reqServer) // reqServer.ListenAndServe()
}

func Status(w http.ResponseWriter, r *http.Request) {
	fmt.Fprint(w, "It works!"+common.GetUerIdText(r))
}

func OnS2SPostback(w http.ResponseWriter, r *http.Request) {
	//TODO 需要根据affiliateNetwork的设置，决定是否去除重复的clickId和transactionId的conversions
	if r.Method != http.MethodGet {
		http.NotFound(w, r)
		return
	}
	units.OnS2SPostback(w, r)
}

const base64GifPixel = "R0lGODlhAQABAIAAAP///wAAACwAAAAAAQABAAACAkQBADs="

func OnConversionPixel(w http.ResponseWriter, r *http.Request) {
	//TODO 去除重复的clickId和transactionId的conversions
	if r.Method != http.MethodGet {
		http.NotFound(w, r)
		return
	}
	units.OnConversionPixel(w, r)

	w.WriteHeader(http.StatusNoContent)

	/* 备忘
	w.Header().Set("Content-Type", "image/gif")
	output, _ := base64.StdEncoding.DecodeString(base64GifPixel)
	w.Write(output)
	*/
}

func OnConversionScript(w http.ResponseWriter, r *http.Request) {
	//TODO 去除重复的clickId和transactionId的conversions
	if r.Method != http.MethodGet {
		http.NotFound(w, r)
		return
	}
	units.OnConversionScript(w, r)

	w.WriteHeader(http.StatusNoContent)
}