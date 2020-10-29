var app = require("../../app");
var request = require('supertest');
var db = require("../db");


var task = { 
    name: 'integration test' 
  };

  describe('Category', function() {
    it('Add category ', async (done)=>{
        await request(app).
        post("/v1/core/add-category").
        send({
                "categoryName":"headphone",
                "isSubCategory":false,
                "subCategory":[{
                    "categoryName":"jbl",
                    "isSubCagegory":"yes",
                    "subCategory":[
                            {
                                "categoryName":"a3",
                                "isSubCagegory":"yes"
                            }
                        ]
                },{
                    "categoryName":"boss",
                    "isSubCagegory":"yes",
                    "subCategory":[
                            {
                                "categoryName":"b3",
                                "isSubCagegory":"yes"
                            }
                        ]
                }]
            }
        )
        .expect(201)
        .expect((res)=>{
            task = res.body;  
            })       
        // expect(response.statusCode).to.equal(200);
        done();
    });

    it('edit category', async (done)=>{
            await request(app).post("/v1/core/edit-category").
            send({
                "categoryId":task.data._id,
                "categoryName":"headphone",
                "isSubCategory":false,
                "subCategory":[{
                    "categoryName":"jbl",
                    "isSubCagegory":"yes",
                    "subCategory":[
                            {
                                "categoryName":"a3",
                                "isSubCagegory":"yes"
                            }
                        ]
                },{
                    "categoryName":"boss",
                    "isSubCagegory":"yes",
                    "subCategory":[
                            {
                                "categoryName":"b3",
                                "isSubCagegory":"yes"
                            }
                        ]
                }]
            })
            .expect(201)
            .expect((res)=>{
            })              
            // expect(response.statusCode).to.equal(200);
            done();
    });
            
    it('list category', async (done)=>{
            await request(app).get("/v1/core/categories")
            .expect(201)
            .expect((res) => {
        
            })
            done();
    });

    it('delete Category', async (done)=>{
            await request(app).get("/v1/core/edit-category")
            .query({ categoryId: task.data._id })
            .expect(204)
            .expect((res)=>{
            })              
            // expect(response.statusCode).to.equal(200);
            done();
    });
});