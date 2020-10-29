var app = require("../../app");
var request = require('supertest');
var db = require("../db");

var task = { 
    name: 'integration test' 
  };

describe('Auth', function() {
    it(' Register ', async (done)=>{
        task.email = `test-${Math.random()}@yopmail.com`;

        await request(app).post("/v1/auth/register").send({
            "email":task.email,
            "password":"abcd@123",
            "name":"test"
        })
        .expect(201)
        .expect((res)=>{

        })              
        // expect(response.statusCode).to.equal(200);
        done();
    });

    it(' Login ', async (done)=>{
        await request(app).post("/v1/auth/login").send({
            "email":task.email,
            "password":"abcd@123"
        })
        .expect(200)
        .expect((res)=>{
            task.response = res.body;
        })              
        // expect(response.statusCode).to.equal(200);
        done();
    });
        
    it(' Refresh token ', async (done)=>{
        await request(app).post("/v1/auth/refresh-tokens").send({
            "refreshToken":task.response.tokens.refresh.token
        })
        .expect(200)
        .expect((res) => {
            // expect(res.data).to.be.an('array');
            // cons
            // console.log('----------->');
            // console.log(task);
        })
        done();
    });

    it(' Forgot password ', async (done)=>{
        await request(app).post("/v1/auth/forgot-password").send({
            "email":task.email
        })
        .expect(201)
        .expect((res) => {
            // expect(res.data).to.be.an('array');
            // cons
            // console.log('----------->');
            // console.log(task);
        })
        done();
    });

    // it('Reset password ', async (done)=>{
    //     await request(app).post("/v1/auth/reset-password")
    //     .query({ token: task.response.tokens.access.token })
    //     .expect(200)
    //     .expect((res)=>{
    //     })              
    //     // expect(response.statusCode).to.equal(200);
    //     done();
    // });
});