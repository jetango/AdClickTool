/**
 * Created by Aedan on 11/01/2017.
 */

var express = require('express');
var router = express.Router();
var Joi = require('joi');
var common =require('./common');


/**
 * @api {post} /api/lander  新增lander
 * @apiName lander
 * @apiGroup lander
 *
 * @apiParam {String} name
 * @apiParam {String} url
 * @apiParam {Number} numberOfOffers
 * @apiParam {Object} [country]
 * @apiParam {Array} [tags]
 *
 * @apiSuccessExample {json} Success-Response:
 *   {
 *    status: 1,
 *    message: 'success' *   }
 *
 */
router.post('/api/lander', function (req, res, next) {
    var schema = Joi.object().keys({
        userId: Joi.number().required(),
        name: Joi.string().required(),
        url: Joi.string().required(),
        country: Joi.object().optional(),
        numberOfOffers: Joi.number().required(),
        tags: Joi.array().optional()
    });

    req.body.userId = req.userId
    const start = async ()=>{
        try{
            let value=await common.validate(req.body,schema);
            let connection=await common.getConnection();
            let landerResult=await common.insertLander(value.userId,value,connection);
            if(value.tags && value.tags.length){
                for(let index=0;index<value.tags.length;index++){
                    await common.insertTags(value.userId,landerResult.insertId,value.tags[index],2,connection);
                }
            }
            delete value.userId;
            value.id=landerResult.insertId;
            connection.release();
            res.json({
                status: 1,
                message: 'success',
                data: value
                });                  
        }catch(e){
            next(e);
        }
       
    }
    start();
   
});


/**
 * @api {post} /api/lander/:id  编辑lander
 * @apiName lander
 * @apiGroup lander
 *
 *
 * @apiParam {String} name
 * @apiParam {String} url
 * @apiParam {Number} numberOfOffers
 * @apiParam {Object} [country]
 * @apiParam {Array} [tags]
 * @apiParam {Number} [deleted]
 *
 * @apiSuccessExample {json} Success-Response:
 *   {
 *    status: 1,
 *    message: 'success' *   }
 *
 */
router.post('/api/lander/:id', function (req, res, next) {
    var schema = Joi.object().keys({
        id: Joi.number().required(),
        userId: Joi.number().required(),
        name: Joi.string().required(),
        url: Joi.string().required(),
        country: Joi.object().optional(),
        numberOfOffers: Joi.number().required(),
        tags: Joi.array().optional(),
        deleted: Joi.number().optional(),
        hash: Joi.string().optional()
    });

    req.body.userId = req.userId
    req.body.id = req.params.id;
   const start = async ()=>{
       try{
           let value=await common.validate(req.body,schema);
           let connection=await common.getConnection();
           await common.updateLander(value.userId,value,connection);
           await common.updateTags(value.userId,value.id,2,connection);
           if(value.tags && value.tags.length){
                for(let index=0;index<value.tags.length;index++){
                    await common.insertTags(value.userId,value.id,value.tags[index],2,connection);
                }
            }
            delete value.userId;
            connection.release();
            res.json({
                status: 1,
                message: 'success',
                data: value
            }); 


       }catch(e){
          next(e);
       }
   }
   start();
});


/**
 * @api {get} /api/lander/:id  lander detail
 * @apiName lander
 * @apiGroup lander
 *
 *
 *
 * @apiSuccessExample {json} Success-Response:
 *   {
 *    status: 1,
 *    message: 'success',data:{}  }
 *
 */
router.get('/api/lander/:id',function(req,res,next){
    var schema = Joi.object().keys({
        id: Joi.number().required(),
        userId: Joi.number().required()
    });
    req.query.id=req.params.id;
    req.query.userId=req.userId;
    const start = async ()=>{
        try{
           let value = await common.validate(req.query,schema);
           let connection= await common.getConnection();
           let result=await common.getLanderDetail(value.id,value.userId,connection);
           connection.release();
           res.json({
               status:1,
               message:'success',
               data:result
           });
        }catch(e){
            return next(err);
        }
    }
   start();

})

module.exports = router;