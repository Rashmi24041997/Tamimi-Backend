
// var request = require('supertest');

//("http://localhost:5000/v1/");
var app = require("../app");
var request = require('supertest');
const config = require('../config/config');
var jest = require('jest');
var task = { 
    name: 'integration test' 
  };
  
// var base_url = 'http://localhost:5000/v1/';
const mongoose = require('mongoose');
mongoose.connect(config.mongoose.url, {
    "auth": { "authSource": "admin" },
    "user": "nwtest",
    "pass": "#net@worktestSuite",
    "useCreateIndex": true,
    "useNewUrlParser": true,
    "useUnifiedTopology": true,
  }).then(() => {
    // logger.info('Connected to MongoDB');
    // server = app.listen(config.port, () => {
    //   // logger.info(`Listening to port ${config.port} ${config.mongoose.url}`);
    // })
  });

beforeEach(()=>{
// console.log(app);
    // console.log(request(app));
    // jest.useFakeTimers();
})

describe('Backend Admin', function() {
    
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
                .expect(201)
                .expect((res) => {
                    // expect(res.data).to.be.an('array');
                    // cons
                    console.log('----------->');
                    console.log(task);
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
                    console.log('----------->');
                    console.log(task);
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

    describe('User Management', function() {
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
                    console.log('----------->');
                    console.log(task);
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
        
        describe('PageGroup', function() {
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
                    console.log('----------->');
                    console.log(task);
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
        });
        
    });

    describe('Catalogue management', function() {
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
                    console.log(task);  
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

        describe('Customer Management', function() {
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
                .expect(201)
                .expect((res) => {
                    // expect(res.data).to.be.an('array');
                    // cons
                    console.log('----------->');
                    console.log(task);
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
                    console.log('----------->');
                    console.log(task);
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

        describe('Store Management', function() {
            it('Add store ', async (done)=>{
                await request(app).
                post("/v1/core/add-store").
                send({ 
                    "storeName":"Riyadh",
                    "storeCode":"2312",
                    "status":true
                  })
                .expect(201)
                .expect((res)=>{
                        task.store = res.body;  
                    })       
                // expect(response.statusCode).to.equal(200);
                done();
            });

            it('Edit store', async (done)=>{
                    await request(app).post("/v1/core/edit-store").
                    send({ 
                        "storeId":task.data._id,
                        "storeName":"edit",
                        "status":true
                      })
                    .expect(201)
                    .expect((res)=>{
                    })              
                    // expect(response.statusCode).to.equal(200);
                    done();
            });
                    
            it('List stores', async (done)=>{
                    await request(app).get("/v1/core/stores")
                    .expect(201)
                    .expect((res) => {
                
                    })
                    done();
            });

            it('Delete store', async (done)=>{
                    await request(app).get("/v1/core/edit-store")
                    .query({ storeId: task.data._id })
                    .expect(204)
                    .expect((res)=>{
                    })              
                    // expect(response.statusCode).to.equal(200);
                    done();
            });
        });

        describe('Stock Management', function() {
            it('Add store strock ', async (done)=>{
                await request(app).
                post("/v1/core/add-product-stock").
                send({ 
                    "storeId":"5f2188b2cf2b6223af5de232",
                    "productId":"5f1fd492afa16c4081a76a8c",
                    "stock":"233",
                    "status":true
                  })
                .expect(201)
                .expect((res)=>{
                    console.log('--------------->');
                    console.log(__dirname__);
                    task = res.body;  
                    })       
                // expect(response.statusCode).to.equal(200);
                done();
            });

            it('update store stock', async (done)=>{
                    await request(app).post("/v1/core/update-product-inventory").
                    send({ 
                        "storeId":"5f2188b2cf2b6223af5de232",
                        "productId":"5f1fd492afa16c4081a76a8c",
                        "stock":"233",
                        "status":true
                      })
                    .expect(201)
                    .expect((res)=>{
                    })              
                    // expect(response.statusCode).to.equal(200);
                    done();
            });
            
            it('update product status', async (done)=>{
                await request(app).post("/v1/core/update-product-status").
                send({ 
                    "storeId":"5f2188b2cf2b6223af5de232",
                    "productId":"5f1fd492afa16c4081a76a8c",
                    "stock":"233",
                    "status":true
                  })
                .expect(201)
                .expect((res)=>{
                })              
                // expect(response.statusCode).to.equal(200);
                done();
        });        
            it('Get store products', async (done)=>{
                    await request(app).get("/v1/core/get-store-products")
                    .query({ storeId: "5f2188b2cf2b6223af5de232" })
                    .expect(201)
                    .expect((res) => {
                
                    })
                    done();
            });

            it('Remove product stock', async (done)=>{
                    await request(app).get("/v1/core/remove-product-stock")
                    .query({ storeId: "5f2188b2cf2b6223af5de232" })
                    .query({ productId: "5f1fd492afa16c4081a76a8c" })
                    .expect(204)
                    .expect((res)=>{
                    })              
                    // expect(response.statusCode).to.equal(200);
                    done();
            });
        });


    });
    
    describe('Content management', function() {
        describe('Page', function() {
            it('Add page ', async (done)=>{
                await request(app).
                post("/v1/utility/addPage")
                .field("heading", "Page Heading")
                .field("content", "Content")
                .attach("pageImgs", "./src/__tests__/test_img.png")                
                .expect(201)
                .expect((res)=>{
                    task = res.body;
                    console.log(task);  
                    })       
                // expect(response.statusCode).to.equal(200);
                done();
            });
        });     
    });
});

