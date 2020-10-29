var app = require("../../app");
var request = require('supertest');
var db = require("../db");

var task = { 
    name: 'integration test' 
  };


  describe('Product', function() {
    it('Add product ', async (done)=>{
        await request(app).
        post("/v1/core/add-product")
        .field("title", "John Doe")
        .field("description", "John Doe")
        .field("price", "100")
        .field("unit", "ml")
        .field("categoryIds", '["5f1eda7b49f1c471f9aa48a6"]')
        .field("varuants", '[{"size":"50g"}]')
        .field("brandId", "5f1eda7b49f1c471f9aa48a6")
        .field("isInStock", "true")
        .field("status", "true")
        // .attach("defaultImage", "./test_img.png")                
        .expect(201)
        .expect((res)=>{
            task = res.body;
           db.showLogs(task);  
            })       
        // expect(response.statusCode).to.equal(200);
        done();
    });

    it('edit product', async (done)=>{
            await request(app)
            .post("/v1/core/edit-product")
            .field("productId", task.data._id)
            .field("title", "John Doe")
            .field("description", "John Doe")
            .field("price", "100")
            .field("unit", "ml")
            .field("categoryIds", '["5f1eda7b49f1c471f9aa48a6"]')
            .field("varuants", '[{"size":"50g"}]')
            .field("brandId", "5f1eda7b49f1c471f9aa48a6")
            .field("isInStock", "true")
            .field("status", "true")
            .expect(201)
            .expect((res)=>{
            })              
            // expect(response.statusCode).to.equal(200);
            done();
    });
            
    it('list products', async (done)=>{
            await request(app).
            get("/v1/core/products")
            .expect(201)
            .expect((res) => {
                // console.log(task.data._id);
            })
            done();
    });

    it('delete Products', async (done)=>{
            await request(app)
            .get("/v1/core/edit-product")
            .query({ productID: task.data._id })
            .expect(204)
            .expect((res)=>{

            })              
            // expect(response.statusCode).to.equal(200);
            done();
    });
});