var express = require('express');
var router = express.Router();
var Joi = require('joi');
var common = require('./common');
var setting = require('../config/setting');

/**
 * @api {get}/api/fraud-filter/rules/:id  获取用户 fraud-filter rule detail
 * @apiName   获取用户 fraud-filter rule detail
 * @apiGroup fraud-filter
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "status": 1,
 *       "message": "success"
 *       "data":{}
 *     }
 *
 */
router.get('/api/fraud-filter/rules/:id', async function (req, res, next) {
    let connection;
    try {
        var schema = Joi.object().keys({
            userId: Joi.number().required(),
            id: Joi.number().required()
        });
        req.query.userId = req.parent.id;
        req.query.id = req.params.id;
        let value = await common.validate(req.query, schema);
        connection = await common.getConnection();
        let sql = `select id,name,dimension,timeSpan,\`condition\`,status from FraudFilterRule where id= ? and userId = ?`;
        let camsql = `select c.campaignId as id ,t.name as name from  FFRule2Campaign c inner join TrackingCampaign t on t.id=c.campaignId where t.userId=? and c.ruleId=?`;
        let [
            [Result], campaigns
        ] = await Promise.all([common.query(sql, [value.id, value.userId], connection),
        common.query(camsql, [value.userId, value.id], connection)
        ]);
        if (Result) {
            let campaignSlice = [];
            for (let index = 0; index < campaigns.length; index++) {
                campaignSlice.push(campaigns[index].id);
            }
            Result.campaigns = campaignSlice.join(',');
        }
        res.json({
            status: 1,
            message: "success",
            data: Result ? Result : {}
        });

    } catch (e) {
        next(e);
    } finally {
        if (connection) {
            connection.release();
        }
    }
});


/**
 * @api {get} /api/fraud-filter/rules  获取用户fraud-filter Rules
 * @apiName  获取用户sudden change Rules
 * @apiGroup fraud-filter
 * @apiParam {Number} page
 * @apiParam {Number} limit
 * @apiParam {Number} status: 0: inactive, 1: active, 2: all
 * @apiParam {String} [filter]
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "status": 1,
 *       "message": "success"
 *       "data":{}
 *     }
 *
 */

router.get('/api/fraud-filter/rules', async function (req, res, next) {

    let connection;
    try {
        let schema = Joi.object().keys({
            userId: Joi.number().required(),
            page: Joi.number().required(),
            limit: Joi.number().required(),
            filter: Joi.string().optional(),
            status: Joi.number().required()
        });
        req.query.userId = req.parent.id;
        let value = await common.validate(req.query, schema);
        let {
            limit,
            page
        } = value;

        // limit
        limit = parseInt(limit);
        if (!limit || limit < 0)
            limit = 50;
        value.limit = limit;
        // offset
        page = parseInt(page);
        let offset = (page - 1) * limit;
        if (!offset)
            offset = 0;
        value.offset = offset;
        connection = await common.getConnection();
        let filter = "";
        if (value.filter != undefined && value.filter) {
            filter = ` and name like '%${value.filter}%' `;
        }
        let statusFilter = "";
        switch (value.status) {
            case 2:
                statusFilter = "";
                break;
            default:
                statusFilter = ` and status=${value.status} `;
        }
        let sql = `select id,name,dimension,timeSpan,status from FraudFilterRule where userId =? and deleted=0 ${filter} ${statusFilter} order by id DESC `;
        let totalsql = `select count(*) as total from  ((${sql}) as T)`;
        sql += ` limit ?,?`
        let params = [value.userId, value.offset, value.limit];
        let [Result, [{
            total: Total
        }]] = await Promise.all(
                [common.query(sql, params, connection),
                common.query(totalsql, [value.userId], connection)
                ]);
        return res.json({
            status: 1,
            message: "success",
            data: {
                rules: Result,
                "totalRows": Total
            }
        });

    } catch (e) {
        next(e);
    } finally {
        if (connection) {
            connection.release();
        }
    }
});

/**
 * @api {post} /api/automated/rules  sudden change编辑Rule
 * @apiName sudden change编辑Rule
 * @apiGroup  sudden_change
 *
 * @apiParam {String} [name]
 * @apiParam {String} [campaigns]
 * @apiParam {String} [dimension]
 * @apiParam {Number} [timeSpan]
 * @apiParam {String} [condition]
 * @apiParam {Number} [status]
 *
 * @apiSuccessExample {json} Success-Response:
 *   {
 *    status: 1,
 *    message: 'success'
 *   }
 *
 */


router.put('/api/fraud-filter/rules/:id', async function (req, res, next) {
    var schema = Joi.object().keys({
        id: Joi.number().required(),
        userId: Joi.number().required(),
        name: Joi.string().optional(),
        campaigns: Joi.string().optional(),
        dimension: Joi.string().optional(),
        timeSpan: Joi.number().optional(),
        condition: Joi.string().optional(),
        status: Joi.number().optional()
    });

    req.body.userId = req.parent.id;
    req.body.id = req.params.id;
    let connection;
    try {
        let value = await common.validate(req.body, schema);
        connection = await common.getConnection();
        let sql = `update FraudFilterRule set userId = ? `;
        let params = [value.userId]
        if (value.name != undefined) {
            sql += `,name= ?`;
            params.push(value.name)
        }
        if (value.dimension != undefined) {
            sql += `,dimension= ?`;
            params.push(value.dimension)
        }
        if (value.timeSpan != undefined) {
            sql += `,timeSpan= ?`;
            params.push(value.timeSpan)
        }
        if (value.condition != undefined) {
            sql += `,\`condition\`= ?`;
            params.push(value.condition)
        }
        if (value.status != undefined) {
            sql += `,status= ?`;
            params.push(value.status)
        }
        sql += ` where id= ? and userId= ?`;
        params.push(value.id);
        params.push(value.userId);
        await common.query(sql, params, connection);
        if (value.campaigns != undefined) {
            await common.query('delete from FFRule2Campaign where ruleId = ?', [value.id], connection);
            let campaignArray = value.campaigns.split(',');
            for (let index = 0; index < campaignArray.length; index++) {
                await common.query('insert into FFRule2Campaign(ruleId,campaignId) values (?,?)', [value.id, campaignArray[index]], connection);
            }
        }
        //redis pub
        redisPool.publish(setting.redis.channel, value.userId + ".update.ffrule." + value.id);
        delete value.userId;
        res.json({
            status: 1,
            message: 'success',
            data: value
        });
    } catch (e) {
        next(e);
    } finally {
        if (connection) {
            connection.release();
        }
    }
});


/**
 * @api {post} /api/fraud-filter/rules  fraud-filter新增Rule
 * @apiName fraud-filter新增Rule
 * @apiGroup  fraud-filter
 *
 * @apiParam {String} name
 * @apiParam {String} campaigns
 * @apiParam {String} dimension
 * @apiParam {Number} timeSpan
 * @apiParam {String} condition
 *
 * @apiSuccessExample {json} Success-Response:
 *   {
 *    status: 1,
 *    message: 'success'
 *   }
 *
 */
router.post('/api/fraud-filter/rules', async function (req, res, next) {
    var schema = Joi.object().keys({
        userId: Joi.number().required(),
        name: Joi.string().required(),
        campaigns: Joi.string().required(),
        dimension: Joi.string().required(),
        timeSpan: Joi.number().required(),
        condition: Joi.string().required(),
        status: Joi.number().required()
    });
    req.body.userId = req.parent.id;
    let connection;
    try {
        let value = await common.validate(req.body, schema);
        connection = await common.getConnection();
        let sql = `insert into FraudFilterRule (userId,name,dimension,timeSpan,\`condition\`,status) values(?,?,?,?,?,?)`;
        let params = [value.userId, value.name, value.dimension, value.timeSpan, value.condition, value.status];
        let {
            insertId: InsertId
        } = await common.query(sql, params, connection);
        let campaignArray = value.campaigns.split(',');
        for (let index = 0; index < campaignArray.length; index++) {
            await common.query('insert into FFRule2Campaign(ruleId,campaignId) values (?,?)', [InsertId, campaignArray[index]], connection);
        }
        //redis pub
        redisPool.publish(setting.redis.channel, value.userId + ".add.ffrule." +
            InsertId);
        value.id = InsertId;
        delete value.userId;
        value.status = 0; //default 0 
        res.json({
            status: 1,
            message: 'success',
            data: value
        });
    } catch (e) {
        next(e);
    } finally {
        if (connection) {
            connection.release();
        }
    }
});


/**
 * @api {delete} /api/fraud-filter/rules/:id 删除rule
 * @apiName  删除rule
 * @apiGroup fraud-filter
 * 
 */
router.delete('/api/fraud-filter/rules/:id', async function (req, res, next) {
    var schema = Joi.object().keys({
        id: Joi.number().required(),
        userId: Joi.number().required()
    });
    req.query.userId = req.parent.id;
    req.query.id = req.params.id;
    let connection;
    try {
        let value = await common.validate(req.query, schema);
        connection = await common.getConnection();
        let sql = `update FraudFilterRule set deleted = 1 where userId = ? and id =?`;
        await common.query(sql, [value.userId, value.id], connection);
        //redis pub
        redisPool.publish(setting.redis.channel, value.userId + ".delete.ffrule." + value.id);
        res.json({
            status: 1,
            message: 'success'
        });
    } catch (e) {
        next(e);
    } finally {
        if (connection) {
            connection.release();
        }
    }
});

/**
 * @api {get}/api/automated/logs 获取rule的log记录
 * @apiName获取rule的log记录
 *
 * @apiGroup sudden_change
 * 
 *@apiParam {Number} page
 *@apiParam {Number} limit
 *@apiParam {String} filter
 *@apiParam {String} [from]
 *@apiParam {String} [to]
 * 
 */

router.get('/api/fraud-filter/logs', async function (req, res, next) {
    let schema = Joi.object().keys({
        userId: Joi.number().required(),
        page: Joi.number().required(),
        limit: Joi.number().required(),
        filter: Joi.string().optional(),
        from: Joi.string().required(),
        to: Joi.string().required(),
        tz: Joi.string().required()
    });
    req.query.userId = req.parent.id;
    let connection;
    try {
        let value = await common.validate(req.query, schema);
        connection = await common.getConnection();
        let {
            limit,
            page
        } = value;
        // limit
        limit = parseInt(limit);
        if (!limit || limit < 0)
            limit = 50;
        value.limit = limit;
        // offset
        page = parseInt(page);
        let offset = (page - 1) * limit;
        if (!offset)
            offset = 0;
        value.offset = offset;

        let filter = "";
        if (value.filter != undefined && value.filter) {
            filter = ` and rule.name like '%${value.filter}%' `;
        }

        let timeFilter = "";
        if (value.from) {
            timeFilter += ` and log.timeStamp >= (UNIX_TIMESTAMP(CONVERT_TZ('${value.from}', '${value.tz}','+00:00')))  `;
        }
        if (value.to) {
            timeFilter += ` and log.timeStamp <= (UNIX_TIMESTAMP(CONVERT_TZ('${value.to}', '${value.tz}','+00:00')))  `;
        }

        let sql = `select log.id as id ,DATE_FORMAT(convert_tz(FROM_UNIXTIME(log.timeStamp, "%Y-%m-%d %H:%i:%s"),'+00:00','${value.tz}') ,'%Y-%m-%d %H:%i:%s') as time,rule.name as name,log.dimension as dimension  
                  from FraudFilterLog log inner join FraudFilterRule rule on log.ruleId = rule.id  where rule.userId =? ${filter} ${timeFilter} order by log.timeStamp DESC`;

        let totalsql = `select count(*) as total from  ((${sql}) as T)`;
        sql += ` limit ?,?`
        let params = [value.userId, value.offset, value.limit];
        let [Result, [{
            total: Total
        }]] = await Promise.all(
                [common.query(sql, params, connection),
                common.query(totalsql, [value.userId], connection)
                ]);

        return res.json({
            status: 1,
            message: 'success',
            data: {
                logs: Result,
                totalRows: Total
            }
        });
    } catch (e) {
        next(e);
    } finally {
        if (connection) {
            connection.release();
        }
    }
});



/**
 * @apiName 获取rule的log的详情
 *
 */
router.get('/api/fraud-filter/logs/:id', async function (req, res, next) {
    let schema = Joi.object().keys({
        userId: Joi.number().required(),
        id: Joi.number().required()
    });
    req.query.userId = req.parent.id;
    req.query.id = req.params.id;
    let connection;
    try {
        let value = await common.validate(req.query, schema);
        connection = await common.getConnection();

        let sql = `select detail.id,detail.data,cam.name as campaign,log.dimension as dimension,DATE_FORMAT(FROM_UNIXTIME(log.timeStamp), "%Y-%d-%m %H:%i:%s") as time from FraudFilterLogDetail detail inner join TrackingCampaign cam on cam.id = detail.campaignID 
                   inner join FraudFilterLog log on log.id = detail.logId where detail.logId = ?`;
        let Result = await common.query(sql, [value.id], connection);

        for (let index = 0; index < Result.length; index++) {
            if (Result[index].data) {
                Result[index].data = JSON.parse(Result[index].data)
            }

        }
        return res.json({
            status: 1,
            message: 'success',
            data: {
                logs: Result
            }
        });
    } catch (e) {
        next(e);
    } finally {
        if (connection) {
            connection.release();
        }
    }
});



module.exports = router;