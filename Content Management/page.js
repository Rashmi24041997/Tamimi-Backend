var app = require("../../app");
var request = require('supertest');
var db = require("../db");

var task = { 
    name: 'integration test' 
  };

describe('Page', function() {
    it('Add page ', async (done)=>{
        await request(app).
        post("/v1/utility/addPage")
        .field("heading", "Page Heading")
        .field("content", "Content")
        .attach("pageImgs", "./src/public/test/test_img.png")                
        .expect(201)
        .expect((res)=>{
            task = res.body;
           db.showLogs(task);  
            })       
        // expect(response.statusCode).to.equal(200);
        done();
    });
});