var app = require("../../app");
var request = require('supertest');
var db = require("../db");

var task = { 
    name: 'integration test' 
  };


  describe('Vendor', function() {
    it('Add vendor ', async (done)=>{
        await request(app).
        post("/v1/core/add-vendor").
        send({ 
            "name":"Test-Vendor1",
            "status":true,
            "address":"new delhi",
            "zipCode":"",
            "city":"",
            "state":"",
            "country":"",
            "phoneNo":"",
            "gstNo":"223",
            "panNo":"23SFSD123",
            "website":"www.sdfsdf.com",
            "email":"sfsdf@sdf.com",
            "isVendor":true,
            "isManufacture":false,
            "accountNo":"23432432434343434",
            "ifscCode":"sfsW3",
            "bankName":"axis",
            "branch":"delhi",
            "otherInfo":"skjf"
        })
        .expect(201)
        .expect((res)=>{
            task = res.body;  
            })       
        // expect(response.statusCode).to.equal(200);
        done();
    });

    it('edit vendor', async (done)=>{
            await request(app).post("/v1/core/edit-vendor").
            send({ 
                "vendorId":task.data._id,
                "name":"Test-Vendor1",
                "status":true,
                "address":"new delhi",
                "zipCode":"",
                "city":"",
                "state":"",
                "country":"",
                "phoneNo":"",
                "gstNo":"223",
                "panNo":"23SFSD123",
                "website":"www.sdfsdf.com",
                "email":"sfsdf@sdf.com",
                "isVendor":true,
                "isManufacture":false,
                "accountNo":"23432432434343434",
                "ifscCode":"sfsW3",
                "bankName":"axis",
                "branch":"delhi",
                "otherInfo":"skjf"
            })
            .expect(201)
            .expect((res)=>{
            })              
            // expect(response.statusCode).to.equal(200);
            done();
    });
            
    it('list Vendor', async (done)=>{
            await request(app).get("/v1/core/vendors")
            .expect(201)
            .expect((res) => {
        
            })
            done();
    });

    it('delete Vendor', async (done)=>{
            await request(app).get("/v1/core/edit-vendor")
            .query({ vendorId: task.data._id })
            .expect(204)
            .expect((res)=>{
            })              
            // expect(response.statusCode).to.equal(200);
            done();
    });
});