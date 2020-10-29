var app = require("../../app");
var request = require('supertest');
var db = require("../db");

var task = { 
    name: 'integration test' 
  };

describe('Order', function() {
    it('add order ', async (done)=>{
        await request(app).post("/v1/core/add-order").send({
            "orderNumber": "123",
            "cartId":"5f23c70e8757fc21b20cf244",
            "customerId": "5f23c70e8757fc21b20cf244",
            "totalPrice": "233.99",
            "subtotalPrice": "200",
            "totalWeight":"23g",
            "totalTax": "0",
            "totalDiscount": "11",
            "discounts":"5f23c70e8757fc21b20cf244",
            "taxesIncluded": true,
            "items":[{
                "_id":"5f23c70e8757fc21b20cf244",
                "name":"pasta",
                "quantity":"2323",
                "price":"1221"
                
            }],
            "currency": "USD",
            "shippings":"",
            "shippingAddress":"",
            "billingAddress":"",
            "refunds":"",
            "transaction":"5f23c70e8757fc21b20cf244",
            "isTestOrder":true
        })
        .expect(201)
        .expect((res)=>{
            task = res.body;
        })              
        // expect(response.statusCode).to.equal(200);
        done();
    });

    it('edit order ', async (done)=>{
        await request(app).post("/v1/core/edit-order").send({
            "orderId":task.data._id,
            "orderNumber": "123",
            "cartId":"5f23c70e8757fc21b20cf244",
            "customerId": "5f23c70e8757fc21b20cf244",
            "totalPrice": "233.99",
            "subtotalPrice": "200",
            "totalWeight":"23g",
            "totalTax": "0",
            "totalDiscount": "11",
            "discounts":"5f23c70e8757fc21b20cf244",
            "taxesIncluded": true,
            "items":[{
                "_id":"5f23c70e8757fc21b20cf244",
                "name":"pasta",
                "quantity":"2323",
                "price":"1221"
                
            }],
            "currency": "USD",
            "shippings":"",
            "shippingAddress":"",
            "billingAddress":"",
            "refunds":"",
            "transaction":"5f23c70e8757fc21b20cf244",
            "isTestOrder":true
        })
        .expect(201)
        .expect((res)=>{
        })              
        // expect(response.statusCode).to.equal(200);
        done();
    });
        
    it('list order ', async (done)=>{
        await request(app).get("/v1/core/list-order")
        .expect(201)
        .expect((res) => {
            // expect(res.data).to.be.an('array');
            // cons
            db.showLogs('----------->');
            db.showLogs(task);
        })
        done();
    });

    it('delete order ', async (done)=>{
        await request(app).get("/v1/core/edit-order")
        .query({ orderId: task.data._id })
        .expect(204)
        .expect((res)=>{
        })              
        // expect(response.statusCode).to.equal(200);
        done();
    });
});  


    