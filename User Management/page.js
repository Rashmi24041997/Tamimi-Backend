var app = require("../../app");
var request = require('supertest');
var db = require("../db");

var task = { 
    name: 'integration test' 
  };

beforeEach(()=>{
// db.showLogs(app);
    // db.showLogs(request(app));
    // jest.useFakeTimers();
})

describe('Page', function() {
    it('add page ', async (done)=>{
        await request(app).post("/v1/user-access/add-page").send({ 
            "name": "home-test",
            "route":"sdfs/sdfsdf",
            "accessLevel":1,
            "status":true
        })
        .expect(201)
        .expect((res)=>{
            task = res.body;
        })              
        // expect(response.statusCode).to.equal(200);
        done();
    });

    it('edit page ', async (done)=>{
        await request(app).post("/v1/user-access/add-page").send({ 
            "pageId":task.data._id,
            "name": "homeEdit",
            "route":"sdfs/sdfsdf",
            "accessLevel":1
        })
        .expect(201)
        .expect((res)=>{
        })              
        // expect(response.statusCode).to.equal(200);
        done();
    });
        
    it('list page ', async (done)=>{
        await request(app).get("/v1/user-access/list-page")
        .expect(201)
        .expect((res) => {
            // expect(res.data).to.be.an('array');
            // cons
            db.showLogs('----------->');
            db.showLogs(task);
        })
        done();
    });

    it('delete page ', async (done)=>{
        await request(app).get("/v1/user-access/edit-page")
        .query({ pageId: task.data._id })
        .expect(204)
        .expect((res)=>{
        })              
        // expect(response.statusCode).to.equal(200);
        done();
    });
});
    