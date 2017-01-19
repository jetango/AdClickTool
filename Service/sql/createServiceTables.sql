CREATE TABLE AdClickTool.`User` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `idText` varchar(8) NOT NULL DEFAULT '' COMMENT '用在click,postback等url中，用于区别用户',
  `email` varchar(50) NOT NULL,
  `password` varchar(256) NOT NULL,
  `firstname` varchar(256) NOT NULL,
  `lastname` varchar(256) NOT NULL,
  `rootdomainredirect` varchar(512) NOT NULL DEFAULT '' COMMENT '当访问用户的rootdomain时的跳转页面，如果为空则显示默认的404页面',
  `json` text NOT NULL COMMENT '按照既定规则生成的User信息',
  `deleted` int(11) NOT NULL DEFAULT 0 COMMENT '0:未删除;1:已删除',
  PRIMARY KEY (`id`),
  UNIQUE KEY `idText` (`idtext`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8;


CREATE TABLE AdClickTool.`TrackingCampaign` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `userId` int(11) NOT NULL,
  `name` varchar(256) NOT NULL,
  `hash` varchar(39) NOT NULL,
  `url` varchar(512) NOT NULL COMMENT '根据campaign内容生成的tracking url',
  `impPixelUrl` varchar(512) NOT NULL DEFAULT '',
  `trafficSourceId` int(11) NOT NULL,
  `trafficSourceName` varchar(256) NOT NULL DEFAULT '',
  `country` varchar(3) NOT NULL DEFAULT '' COMMENT 'ISO-ALPHA-3',
  `costModel` int(11) NOT NULL COMMENT '0:Do-not-track-costs;1:cpc;2:cpa;3:cpm;4:auto?',
  `cpcValue` decimal(10,5) NOT NULL DEFAULT 0,
  `cpaValue` decimal(10,5) NOT NULL DEFAULT 0,
  `cpmValue` decimal(10,5) NOT NULL DEFAULT 0,
  `redirectMode` int(11) NOT NULL COMMENT '0:302;1:Meta refresh;2:Double meta refresh',
  `targetType` int(11) NOT NULL DEFAULT 0 COMMENT '跳转类型,0:URL;1:Flow;2:Rule;3:Path;4:Lander;5:Offer',
  `targetFlowId` int(11) NOT NULL,
  `targetUrl` varchar(512) NOT NULL DEFAULT '',
  `status` int(11) NOT NULL COMMENT '0:停止;1:运行',
  `deleted` int(11) NOT NULL DEFAULT 0 COMMENT '0:未删除;1:已删除',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='用户生成的每个Campaign的配置信息';

CREATE TABLE AdClickTool.`Flow` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `userId` int(11) NOT NULL,
  `name` varchar(256) NOT NULL,
  `hash` varchar(39) NOT NULL,
  `country` varchar(3) NOT NULL DEFAULT '' COMMENT 'ISO-ALPHA-3',
  `type` int(11) NOT NULL COMMENT '0:匿名;1:普通(标示Campaign里选择Flow时是否可见)',
  `redirectMode` int(11) NOT NULL COMMENT '0:302;1:Meta refresh;2:Double meta refresh',
  `deleted` int(11) NOT NULL DEFAULT 0 COMMENT '0:未删除;1:已删除',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='用户生成的每个Flow的配置信息';

CREATE TABLE AdClickTool.`Rule` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `userId` int(11) NOT NULL,
  `name` varchar(256) NOT NULL,
  `hash` varchar(39) NOT NULL,
  `type` int(11) NOT NULL COMMENT '0:匿名;1:普通(标示是否是Flow里默认Path的Rule)',
  `json` text NOT NULL COMMENT '按照既定规则生成的rule信息',
  `status` int(11) NOT NULL COMMENT '0:停止;1:运行;用来标记该Rule本身是否有效',
  `deleted` int(11) NOT NULL DEFAULT 0 COMMENT '0:未删除;1:已删除',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='用户生成的每个Rule的配置信息';

CREATE TABLE AdClickTool.`Rule2Flow` (
  `ruleId` int(11) NOT NULL COMMENT '必须非0',
  `flowId` int(11) NOT NULL COMMENT '必须非0',
  `status` int(11) NOT NULL COMMENT '0:停止;1:运行;用来标记Rule在特定Flow中是否有效',
  `deleted` int(11) NOT NULL DEFAULT 0 COMMENT '0:未删除;1:已删除',
  PRIMARY KEY (`flowId`,`ruleId`,`deleted`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE AdClickTool.`Path` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `userId` int(11) NOT NULL,
  `name` varchar(256) NOT NULL,
  `hash` varchar(39) NOT NULL,
  `redirectMode` int(11) NOT NULL COMMENT '0:302;1:Meta refresh;2:Double meta refresh',
  `directLink` int(11) NOT NULL COMMENT '0:No;1:Yes',
  `status` int(11) NOT NULL COMMENT '0:停止;1:运行;用来标记该Path本身是否有效',
  `deleted` int(11) NOT NULL DEFAULT 0 COMMENT '0:未删除;1:已删除',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='用户生成的每个Path的配置信息';

CREATE TABLE AdClickTool.`Path2Rule` (
  `pathId` int(11) NOT NULL COMMENT '必须非0',
  `ruleId` int(11) NOT NULL COMMENT '必须非0',
  `weight` int(11) NOT NULL COMMENT '0~100',
  `status` int(11) NOT NULL COMMENT '0:停止;1:运行;用来标记Path在特定Rule中是否有效',
  `deleted` int(11) NOT NULL DEFAULT 0 COMMENT '0:未删除;1:已删除',
  PRIMARY KEY (`ruleId`,`pathId`,`deleted`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE AdClickTool.`Lander` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `userId` int(11) NOT NULL,
  `name` varchar(256) NOT NULL,
  `hash` varchar(39) NOT NULL,
  `url` varchar(512) NOT NULL,
  `country` varchar(3) NOT NULL DEFAULT '' COMMENT 'ISO-ALPHA-3',
  `numberOfOffers` int(11) NOT NULL,
  `deleted` int(11) NOT NULL DEFAULT 0 COMMENT '0:未删除;1:已删除',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='用户生成的每个Lander的配置信息';

CREATE TABLE AdClickTool.`Lander2Path` (
  `landerId` int(11) NOT NULL COMMENT '必须非0',
  `pathId` int(11) NOT NULL COMMENT '必须非0',
  `weight` int(11) NOT NULL COMMENT '0~100',
  `deleted` int(11) NOT NULL DEFAULT 0 COMMENT '0:未删除;1:已删除',
  PRIMARY KEY (`landerId`,`pathId`,`deleted`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE AdClickTool.`Offer` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `userId` int(11) NOT NULL,
  `name` varchar(256) NOT NULL,
  `hash` varchar(39) NOT NULL,
  `url` varchar(512) NOT NULL,
  `country` varchar(3) NOT NULL DEFAULT '' COMMENT 'ISO-ALPHA-3',
  `AffiliateNetworkId` int(11) NOT NULL COMMENT '标记属于哪家AffiliateNetwork',
  `postbackUrl` varchar(512) NOT NULL,
  `payoutMode` int(11) NOT NULL COMMENT '0:Auto;1:Manual',
  `payoutValue` decimal(10,5) NOT NULL DEFAULT 0,
  `deleted` int(11) NOT NULL DEFAULT 0 COMMENT '0:未删除;1:已删除',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='用户生成的每个Lander的配置信息';

CREATE TABLE AdClickTool.`Offer2Path` (
  `offerId` int(11) NOT NULL COMMENT '必须非0',
  `pathId` int(11) NOT NULL COMMENT '必须非0',
  `weight` int(11) NOT NULL COMMENT '0~100',
  `deleted` int(11) NOT NULL DEFAULT 0 COMMENT '0:未删除;1:已删除',
  PRIMARY KEY (`offerId`,`pathId`,`deleted`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE AdClickTool.`Tags` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `userId` int(11) NOT NULL,
  `name` varchar(256) NOT NULL,
  `type` int(11) NOT NULL COMMENT '1:Campaign;2:Lander;3:Offer',
  `targetId` int(11) NOT NULL COMMENT '必须非0，根据type不同可能为Campaign/Lander/Offer的Id',
  `deleted` int(11) NOT NULL DEFAULT 0 COMMENT '0:未删除;1:已删除',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE AdClickTool.`TrafficSource` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `userId` int(11) NOT NULL,
  `name` varchar(256) NOT NULL,
  `hash` varchar(39) NOT NULL,
  `postbackUrl` varchar(512) NOT NULL,
  `pixelRedirectUrl` varchar(512) NOT NULL,
  `impTracking` int(11) NOT NULL COMMENT '0:No;1:Yes',
  `externalId` varchar(124) NOT NULL COMMENT '按照既定规则生成的ExternalId params信息:{"Parameter":"X","Placeholder":"X","Name":"X"}',
  `cost` varchar(124) NOT NULL COMMENT '按照既定规则生成的Cost params信息:{"Parameter":"X","Placeholder":"X","Name":"X"}',
  `params` text NOT NULL COMMENT '按照既定规则生成的params信息:[{"Parameter":"X","Placeholder":"X","Name":"X","Track":N(0,1)},...]',
  `deleted` int(11) NOT NULL DEFAULT 0 COMMENT '0:未删除;1:已删除',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE AdClickTool.`TemplateTrafficSource` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(256) NOT NULL,
  `postbackUrl` varchar(512) NOT NULL DEFAULT '',
  `pixelRedirectUrl` varchar(512) NOT NULL DEFAULT '',
  `externalId` varchar(124) NOT NULL COMMENT '按照既定规则生成的ExternalId params信息:{"Parameter":"X","Placeholder":"X","Name":"X"}',
  `cost` varchar(124) NOT NULL COMMENT '按照既定规则生成的Cost params信息:{"Parameter":"X","Placeholder":"X","Name":"X"}',
  `params` text NOT NULL COMMENT '按照既定规则生成的params信息:[{"Parameter":"X","Placeholder":"X","Name":"X","Track":N(0,1)},...]',
  `deleted` int(11) NOT NULL DEFAULT 0 COMMENT '0:未删除;1:已删除',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE AdClickTool.`AffiliateNetwork` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `userId` int(11) NOT NULL,
  `name` varchar(256) NOT NULL,
  `hash` varchar(39) NOT NULL,
  `postbackUrl` varchar(512) NOT NULL DEFAULT '',
  `appendClickId` int(11) NOT NULL COMMENT '0:No;1:Yes',
  `duplicatedPostback` int(11) NOT NULL COMMENT '0:No;1:Yes',
  `ipWhiteList` text NOT NULL COMMENT 'IP白名单，数组存储成JSON',
  `deleted` int(11) NOT NULL DEFAULT 0 COMMENT '0:未删除;1:已删除',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE AdClickTool.`TemplateAffiliateNetwork` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(256) NOT NULL,
  `postbackParams` text NOT NULL COMMENT '回调url中参数的写法:{cid:%subid1%;p:%commission%}',
  `desc` text NOT NULL COMMENT '关于该AfflicateNetwork的描述，HTML',
  `deleted` int(11) NOT NULL DEFAULT 0 COMMENT '0:未删除;1:已删除',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE AdClickTool.`UrlTokens` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `token` varchar(64) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `token` (`token`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE AdClickTool.`Country` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(256) NOT NULL,
  `alpha2Code` varchar(2) NOT NULL,
  `alpha3Code` varchar(3) NOT NULL,
  `numCode` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `alpha2Code` (`alpha2Code`),
  UNIQUE KEY `alpha3Code` (`alpha3Code`),
  UNIQUE KEY `numCode` (`numCode`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE AdClickTool.`TimeZones` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(256) NOT NULL,
  `detail` varchar(256) NOT NULL,
  `region` varchar(256) NOT NULL,
  `utcShift` varchar(6) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;