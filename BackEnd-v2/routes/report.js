var express = require('express');
var router = express.Router();
var _ = require('lodash');
var Joi = require('joi');
var common = require('./common');

var mapping = {
    UserID: "UserID",
    campaign: "CampaignID",
    CampaignName: "CampaignName",
    flow: "FlowID",
    FlowName: "FlowName",
    lander: "LanderID",
    LanderName: "LanderName",
    offer: "OfferID",
    OfferName: "OfferName",
    OfferUrl: "OfferUrl",
    OfferCountry: "OfferCountry",
    affiliate: "AffiliateNetworkID",
    AffilliateNetworkName: "AffilliateNetworkName",
    traffic: "TrafficSourceID",
    TrafficSourceName: "TrafficSourceName",
    Language: "Language",
    Model: "Model",
    Country: "Country",
    City: "City",
    Region: "Region",
    ISP: "ISP",
    MobileCarrier: "MobileCarrier",
    Domain: "Domain",
    DeviceType: "DeviceType",
    brand: "Brand",
    OS: "OS",
    OSVersion: "OSVersion",
    Browser: "Browser",
    BrowserVersion: "BrowserVersion",
    ConnectionType: "ConnectionType",
    Timestamp: "Timestamp",
    Visits: "Visits",
    Clicks: "Clicks",
    Conversions: "Conversions",
    Cost: "Cost",
    Revenue: "Revenue",
    Impressions: "Impressions",
    KeysMD5: "KeysMD5",
    V1: "V1",
    V2: "V2",
    V3: "V3",
    V4: "V4",
    V5: "V5",
    V6: "V6",
    V7: "V7",
    V8: "V8",
    V9: "V9",
    V10: "V10"
}


var groupByMapping = {
    offer: 'Offers',
    campaign: 'Campaigns',
    lander: 'Landers',
    trafficSource: 'TrafficSource',
    affiliateNetworkName: 'AffiliateNetworkName'
}

/**
 * @api {post} /api/report  报表
 * @apiName  报表
 * @apiGroup report
 * @apiDescription  报表
 *
 * @apiParam {String} from 开始时间
 * @apiParam {String} to   截止时间
 * @apiParam {String} tz   timezone
 * @apiParam {String} sort  排序字段
 * @apiParam {String} direction  desc
 * @apiParam {String} groupBy
 * @apiParam {String} type
 * @apiParam {Number} offset
 * @apiParam {Number} limit
 * @apiParam {String} include    数据状态 all  traffic active
 * @apiParam {String} [filter]
 * @apiParam {String} [filter1]
 * @apiParam {String} [filter1Value]
 * @apiParam {String} [filter2]
 * @apiParam {String} [filter2Value]
 * @apiParam {String} [filter3]
 * @apiParam {String} [filter3Value]
 * @apiParam {Number} active
 *
 *
 */


//from   to tz  sort  direction columns=[]  groupBy  offset   limit  filter1  filter1Value  filter2 filter2Value

router.get('/api/report', async function (req, res, next) {
    req.query.userId = req.userId;
    try {
        let result;
        let connection = await common.getConnection();
        result = await campaignReport(req.query, connection);
        connection.release();
        res.json({
            status: 1,
            message: 'success',
            data: result
        });
    } catch (e) {
        return next(e);
    }

});
// from:2017-01-23T00:00
// groupBy:lander
// limit:500
// order:-visits
// page:1
// status:1
// to:2017-01-24T23:59
// tz:+08:00

async function campaignReport(value, connection) {
    let {
        groupBy,
        limit,
        page,
        from,
        to,
        tz
    } = value;

    let sqlWhere = {};
    limit = parseInt(limit)
    if (limit < 0)
        limit = 10000
    page = parseInt(page)
    let offset = (page - 1) * limit;
    let attrs = Object.keys(value);
    _.forEach(attrs, (attr)=> {
        if (mapping[attr]) {
            sqlWhere[mapping[attr]] = value[attr];
        }
    })

    let isListPageRequest = Object.keys(sqlWhere).length === 0 && groupByMapping[groupBy]
    let sql
    if (isListPageRequest && groupBy == 'campaign') {
        sql = campaignListSql
    } else if (isListPageRequest && groupBy == 'flow') {
        sql = flowListSql
    } else if (isListPageRequest && groupBy == 'lander') {
        sql = landerListSql
    } else if (isListPageRequest && groupBy == 'offer') {
        sql = offerListSql
    } else if (isListPageRequest && groupBy == 'traffic') {
        sql = trafficListSql
    } else {
        sql = buildSql()({
            sqlWhere,
            from,
            to,
            tz,
            groupBy: mapping[groupBy]
        });
    }
    let countsql = "select COUNT(*) as `total` from ((" + sql + ") as T)";

    sql += " limit " + offset + "," + limit;

    console.log(sql);

    let sumSql = "select sum(`Impressions`) as `impressions`, sum(`Visits`) as `visits`,sum(`Clicks`) as `clicks`,sum(`Conversions`) as `conversions`,sum(`Revenue`) as `revenue`,sum(`Cost`) as `cost`,sum(`Profit`) as `profit`,sum(`Cpv`) as `cpv`,sum(`Ictr`) as `ictr`,sum(`Ctr`) as `ctr`,sum(`Cr`) as `cr`,sum(`Cv`) as `cv`,sum(`Roi`) as `roi`,sum(`Epv`) as `epv`,sum(`Epc`) as `epc`,sum(`Ap`) as `ap` from ((" +
        sql + ") as K)";

    let result = await Promise.all([query(sql, connection), query(countsql, connection), query(sumSql, connection)]);
    if (isListPageRequest) {
        // TODO: it need fill the data
    }
    console.log(result)

    return ({
        totalRows: result[1][0].total,
        totals: result[2][0],
        rows: result[0]
    });

}


function query(sql, connection) {
    return new Promise(function (resolve, reject) {
        connection.query(sql, function (err, result) {
            if (err) {
                reject(err)
            }
            resolve(result);
        })
    })
}


module.exports = router;


function buildSql() {
    let template = `
select ads.UserID,ads.Language,ads.Model,ads.Country,ads.City,ads.Region,ads.ISP,ads.MobileCarrier,ads.Domain,ads.DeviceType,ads.Brand,ads.OS,ads.OSVersion,ads.Browser,ads.BrowserVersion,ads.ConnectionType,ads.Timestamp,sum(ads.Visits) as visits,sum(ads.Clicks) as
clicks, sum(ads.Conversions) as conversions, sum(ads.Cost)/1000000 as cost, sum(ads.Revenue)/1000000 as revenue,sum(ads.Impressions) as impressions,ads.KeysMD5,ads.V1,ads.V2,ads.V3,ads.V4,ads.V5,ads.V6,ads.V7,ads.V8,ads.V9,ads.V10,
c.id as campaignId, c.name as campaignName, c.url as campaignUrl, c.country as campaignCountry,
f.id as flowId, f.name as flowName,
l.id as landerId, l.name as landerName, l.url as landerUrl, l.country as landerCountry,
o.id as offerId, o.name as offerName, o.url as offerUrl, o.country as offerCountry,
t.id as trafficId, t.name as trafficName,
a.id as affiliateId, a.name as affiliateName,
sum(ads.\`Revenue\`/1000000)-sum(ads.\`Cost\`/1000000) as \`profit\`,
sum(ads.\`Cost\`/1000000)/sum(ads.\`Impressions\`) as \`cpv\`,
sum(ads.\`Visits\`)/sum(ads.\`Impressions\`) as \`ictr\`,
sum(ads.\`Clicks\`)/sum(ads.\`Visits\`) as \`ctr\`,
sum(ads.\`Conversions\`)/sum(ads.\`Clicks\`) as \`cr\`,
sum(ads.\`Conversions\`)/sum(ads.\`Visits\`) as \`cv\`,
sum(ads.\`Revenue\`/1000000)/sum(ads.\`Cost\`/1000000) as \`roi\`,
sum(ads.\`Revenue\`/1000000)/sum(ads.\`Visits\`) as \`epv\`,
sum(ads.\`Revenue\`/1000000)/sum(ads.\`Clicks\`) as \`epc\`,
sum(ads.\`Revenue\`/1000000)/sum(ads.\`Conversions\`) as \`ap\`
from AdStatis ads
inner join TrackingCampaign c on c.id = ads.CampaignId
inner join Flow f on f.id = ads.FlowId
inner join Lander l on l.id = ads.LanderId
inner join Offer o on o.id = ads.OfferId
inner join TrafficSource t on t.id = ads.TrafficSourceId
inner join AffiliateNetwork a on a.id = ads.AffiliateNetworkId
where
1=1
and ads.\`Timestamp\` >= (UNIX_TIMESTAMP(CONVERT_TZ('<%= from %>', '+00:00','<%= tz %>')) * 1000)
<% _.forEach(Object.keys(sqlWhere), function(key){ %>
and ads.\`<%- key %>\`=<%= sqlWhere[key]%>
<% }) %>
and ads.\`Timestamp\` <= (UNIX_TIMESTAMP(CONVERT_TZ('<%= to %>', '+00:00','<%= tz %>')) * 1000)
group by \`<%= groupBy %>\`
order by CampaignId `

    return _.template(template);
}


var campaignListSql = `
select 0 as UserID, 0 as Language, 0 as Model, 0 as Country, 0 as City, 0 as Region, 0 as ISP, 0 as MobileCarrier, 0 as Domain, 0 as DeviceType, 0 as Brand, 0 as OS, 0 as OSVersion, 0 as Browser, 0 as BrowserVersion, 0 as ConnectionType, 0 as Timestamp, 0 as visits, 0  as
clicks,  0  as conversions, 0  as cost, 0 as revenue, 0 as impressions, 0 as KeysMD5, 0 as V1, 0 as V2, 0 as V3, 0 as V4, 0 as V5, 0 as V6, 0 as V7, 0 as V8, 0 as V9, 0 as V10,
id as campaignId, name as campaignName, url as campaignUrl, country as campaignCountry,
0 as flowId, 0 as flowName,
0 as landerId, 0 as landerName, 0 as landerUrl, 0 as landerCountry,
0 as offerId, 0 as offerName, 0 as offerUrl, 0 as offerCountry,
0 as trafficId, 0 as trafficName,
0 as affiliateId, 0 as affiliateName,
0 as profit,
0 as cpv,
0 as ictr,
0 as ctr,
0 as cr,
0 as cv,
0 as roi,
0 as epv,
0 as epc,
0 as ap
from TrackingCampaign
`

var flowListSql = `
select 0 as UserID, 0 as Language, 0 as Model, 0 as Country, 0 as City, 0 as Region, 0 as ISP, 0 as MobileCarrier, 0 as Domain, 0 as DeviceType, 0 as Brand, 0 as OS, 0 as OSVersion, 0 as Browser, 0 as BrowserVersion, 0 as ConnectionType, 0 as Timestamp, 0 as visits, 0  as
clicks,  0  as conversions, 0  as cost, 0 as revenue, 0 as impressions, 0 as KeysMD5, 0 as V1, 0 as V2, 0 as V3, 0 as V4, 0 as V5, 0 as V6, 0 as V7, 0 as V8, 0 as V9, 0 as V10,
0 as campaignId, 0 as campaignName, 0 as campaignUrl, 0 as campaignCountry,
id as flowId, Name as flowName,
0 as landerId, 0 as landerName, 0 as landerUrl, 0 as landerCountry,
0 as offerId, 0 as offerName, 0 as offerUrl, 0 as offerCountry,
0 as trafficId, 0 as trafficName,
0 as affiliateId, 0 as affiliateName,
0 as profit,
0 as cpv,
0 as ictr,
0 as ctr,
0 as cr,
0 as cv,
0 as roi,
0 as epv,
0 as epc,
0 as ap
from Flow
`
var landerListSql = `
select 0 as UserID, 0 as Language, 0 as Model, 0 as Country, 0 as City, 0 as Region, 0 as ISP, 0 as MobileCarrier, 0 as Domain, 0 as DeviceType, 0 as Brand, 0 as OS, 0 as OSVersion, 0 as Browser, 0 as BrowserVersion, 0 as ConnectionType, 0 as Timestamp, 0 as visits, 0  as
clicks,  0  as conversions, 0  as cost, 0 as revenue, 0 as impressions, 0 as KeysMD5, 0 as V1, 0 as V2, 0 as V3, 0 as V4, 0 as V5, 0 as V6, 0 as V7, 0 as V8, 0 as V9, 0 as V10,
0 as campaignId, 0 as campaignName, 0 as campaignUrl, 0 as campaignCountry,
0 as flowId, 0 as flowName,
id as landerId, name as landerName, url as landerUrl, country as landerCountry,
0 as offerId, 0 as offerName, 0 as offerUrl, 0 as offerCountry,
0 as trafficId, 0 as trafficName,
0 as affiliateId, 0 as affiliateName,
0 as profit,
0 as cpv,
0 as ictr,
0 as ctr,
0 as cr,
0 as cv,
0 as roi,
0 as epv,
0 as epc,
0 as ap
from Lander
`
var offerListSql = `
select 0 as UserID, 0 as Language, 0 as Model, 0 as Country, 0 as City, 0 as Region, 0 as ISP, 0 as MobileCarrier, 0 as Domain, 0 as DeviceType, 0 as Brand, 0 as OS, 0 as OSVersion, 0 as Browser, 0 as BrowserVersion, 0 as ConnectionType, 0 as Timestamp, 0 as visits, 0  as
clicks,  0  as conversions, 0  as cost, 0 as revenue, 0 as impressions, 0 as KeysMD5, 0 as V1, 0 as V2, 0 as V3, 0 as V4, 0 as V5, 0 as V6, 0 as V7, 0 as V8, 0 as V9, 0 as V10,
0 as campaignId, 0 as campaignName, 0 as campaignUrl, 0 as campaignCountry,
0 as flowId, 0 as flowName,
0 as landerId, 0 as landerName, 0 as landerUrl, 0 as landerCountry,
id as offerId, name as offerName, url as offerUrl, country as offerCountry,
0 as trafficId, 0 as trafficName,
0 as affiliateId, 0 as affiliateName,
0 as profit,
0 as cpv,
0 as ictr,
0 as ctr,
0 as cr,
0 as cv,
0 as roi,
0 as epv,
0 as epc,
0 as ap
from Offer
`
var trafficListSql = `
select 0 as UserID, 0 as Language, 0 as Model, 0 as Country, 0 as City, 0 as Region, 0 as ISP, 0 as MobileCarrier, 0 as Domain, 0 as DeviceType, 0 as Brand, 0 as OS, 0 as OSVersion, 0 as Browser, 0 as BrowserVersion, 0 as ConnectionType, 0 as Timestamp, 0 as visits, 0  as
clicks,  0  as conversions, 0  as cost, 0 as revenue, 0 as impressions, 0 as KeysMD5, 0 as V1, 0 as V2, 0 as V3, 0 as V4, 0 as V5, 0 as V6, 0 as V7, 0 as V8, 0 as V9, 0 as V10,
0 as campaignId, 0 as campaignName, 0 as campaignUrl, 0 as campaignCountry,
0 as flowId, 0 as flowName,
0 as landerId, 0 as landerName, 0 as landerUrl, 0 as landerCountry,
0 as offerId, 0 as offerName, 0 as offerUrl, 0 as offerCountry,
id as trafficId, name as trafficName,
0 as affiliateId, 0 as affiliateName,
0 as profit,
0 as cpv,
0 as ictr,
0 as ctr,
0 as cr,
0 as cv,
0 as roi,
0 as epv,
0 as epc,
0 as ap
from Offer
`

var ListSql = `
select 0 as UserID, 0 as Language, 0 as Model, 0 as Country, 0 as City, 0 as Region, 0 as ISP, 0 as MobileCarrier, 0 as Domain, 0 as DeviceType, 0 as Brand, 0 as OS, 0 as OSVersion, 0 as Browser, 0 as BrowserVersion, 0 as ConnectionType, 0 as Timestamp, 0 as visits, 0  as
clicks,  0  as conversions, 0  as cost, 0 as revenue, 0 as impressions, 0 as KeysMD5, 0 as V1, 0 as V2, 0 as V3, 0 as V4, 0 as V5, 0 as V6, 0 as V7, 0 as V8, 0 as V9, 0 as V10,
0 as campaignId, 0 as campaignName, 0 as campaignUrl, 0 as campaignCountry,
0 as flowId, 0 as flowName,
0 as landerId, 0 as landerName, 0 as landerUrl, 0 as landerCountry,
0 as offerId, 0 as offerName, 0 as offerUrl, 0 as offerCountry,
0 as trafficId, 0 as trafficName,
0 as affiliateId, 0 as affiliateName,
0 as profit,
0 as cpv,
0 as ictr,
0 as ctr,
0 as cr,
0 as cv,
0 as roi,
0 as epv,
0 as epc,
0 as ap
from Offer
`
