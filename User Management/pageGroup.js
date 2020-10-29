var app = require("../../app");
var request = require('supertest');
var db = require("../db");

var task = { 
    name: 'integration test' 
  };

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

it('add page group ', async (done)=>{
    await request(app).post("/v1/user-access/add-pagegroup").send({ 
        "name": "home-page-group-test",
        "pages":[task.data._id],
        "accessLevel":1,
        "status":true
    })
    .expect(201)
    .expect((res)=>{
        task.subtask = res.body;
    })              
    // expect(response.statusCode).to.equal(200);
    done();
});

it('edit page group', async (done)=>{
    await request(app).post("/v1/user-access/edit-pagegroup").send({ 
        "pageGroupId":task.subtask.data._id,
        "pages":[task.data._id],
        "accessLevel":1,
        "status":true
    })
    .expect(201)
    .expect((res)=>{
    })              
    // expect(response.statusCode).to.equal(200);
    done();
});
    
it('list page group', async (done)=>{
    await request(app).get("/v1/user-access/list-pagegroup")
    .expect(201)
    .expect((res) => {
        // expect(res.data).to.be.an('array');
        // cons
        db.showLogs('----------->');
        db.showLogs(task);
    })
    done();
});

it('delete page group', async (done)=>{
    await request(app).get("/v1/user-access/edit-pagegroup")
    .query({ pageGroupId: task.subtask.data._id })
    .expect(204)
    .expect((res)=>{
    })              
    // expect(response.statusCode).to.equal(200);
    done();
});
    