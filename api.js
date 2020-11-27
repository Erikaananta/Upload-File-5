const express = require("express")
const app = express()
const multer = require("multer") // untuk upload file
const path = require("path") // untuk memanggil path direktori
const fs = require("fs") // untuk manajemen file
const mysql = require("mysql")
const cors = require("cors")

app.use(express.static(__dirname));
app.use(express.json())
app.use(express.urlencoded({extended: true}))
app.use(cors())

const storage = multer.diskStorage({
        destination: (req, file, cb) => {
            // set file storage
            cb(null, './image');
        },
        filename: (req, file, cb) => {
            // generate file name 
            cb(null, "image-"+ Date.now() + path.extname(file.originalname))
        }
    })
    
    let upload = multer({storage: storage})

    const db = mysql.createConnection({
            host: "localhost",
            user: "root",
            password: "",
            database: "olshop"
        })
// endpoint untuk menambah data barang baru
app.post("/barang", upload.single("image"), (req, res) => {
        // prepare data
        let data = {
            nama_barang: req.body.nama_barang,
            harga: req.body.harga,
            stok: req.body.stok,
            deskripsi: req.body.deskripsi,
            image: req.file.filename
        }
    
        if (!req.file) {
            // jika tidak ada file yang diupload
            res.json({
                message: "Tidak ada file yang dikirim"
            })
        } else {
            // create sql insert
            let sql = "insert into barang set ?"
    
            // run query
            db.query(sql, data, (error, result) => {
                if(error) throw error
                res.json({
                    message: result.affectedRows + " data berhasil disimpan"
                })
            })
        }
    })

// endpoint untuk mengubah data barang
app.put("/barang", upload.single("image"), (req,res) => {
        let data = null, sql = null
        // paramter perubahan data
        let param = { kode_barang: req.body.kode_barang }
    
        if (!req.file) {
            // jika tidak ada file yang dikirim = update data saja
            data = {
                nama_barang: req.body.nama_barang,
                harga: req.body.harga,
                stok: req.body.stok,
                deskripsi: req.body.deskripsi
            }
        } else {
            // jika mengirim file = update data + reupload
            data = {
                nama_barang: req.body.nama_barang,
                harga: req.body.harga,
                stok: req.body.stok,
                deskripsi: req.body.deskripsi,
                image: req.file.filename
            }
    
            // get data yg akan diupdate utk mendapatkan nama file yang lama
            sql = "select * from barang where ?"
            // run query
            db.query(sql, param, (err, result) => {
                if (err) throw err
                // tampung nama file yang lama
                let fileName = result[0].image
    
                // hapus file yg lama
                let dir = path.join(__dirname,"image",fileName)
                fs.unlink(dir, (error) => {})
            })
    
        }
    
        // create sql update
        sql = "update barang set ? where ?"
    
        // run sql update
        db.query(sql, [data,param], (error, result) => {
            if (error) {
                res.json({
                    message: error.message
                })
            } else {
                res.json({
                    message: result.affectedRows + " data berhasil diubah"
                })
            }
        })
    })

// endpoint untuk menghapus data barang
app.delete("/barang/:kode_barang", (req,res) => {
        let param = {kode_barang: req.params.kode_barang}
    
        // ambil data yang akan dihapus
        let sql = "select * from barang where ?"
        // run query
        db.query(sql, param, (error, result) => {
            if (error) throw error
            
            // tampung nama file yang lama
            let fileName = result[0].image
    
            // hapus file yg lama
            let dir = path.join(__dirname,"image",fileName)
            fs.unlink(dir, (error) => {})
        })
    
        // create sql delete
        sql = "delete from barang where ?"
    
        // run query
        db.query(sql, param, (error, result) => {
            if (error) {
                res.json({
                    message: error.message
                })
            } else {
                res.json({
                    message: result.affectedRows + " data berhasil dihapus"
                })
            }      
        })
    })

// endpoint ambil data barang
app.get("/barang", (req, res) => {
        // create sql query
        let sql = "select * from barang"
    
        // run query
        db.query(sql, (error, result) => {
            if (error) throw error
            res.json({
                data: result,
                count: result.length
            })
        })
    })

//admin

app.get("/admin", (req, res) => {
        // create sql query
        let sql = "select * from admin"
    
        // run query
        db.query(sql, (error, result) => {
            let response = null
            if (error) {
                response = {
                    message: error.message // pesan error
                }            
            } else {
                response = {
                    count: result.length, // jumlah data
                    admin: result // isi data
                }            
            }
            res.json(response) // send response
        })
})

app.get("/admin/:id", (req, res) => {
            let data = {
                id_admin: req.params.id
            }
            // create sql query
            let sql = " select * from admin where?"
        
            // run query
            db.query(sql, data, (error, result) => {
                let response = null
                if (error) {
                    response = {
                        message: error.message // pesan error
                    }            
                } else {
                    response = {
                        count: result.length, // jumlah data
                        admin: result // isi data
                    }            
                }
                res.json(response) // send response
            })
    })
    
app.post("/admin", (req,res) => {
    
            // prepare data
        let data = req.body
        
            // create sql query insert
    
        let sql = `
            insert into admin (id_admin, nama_admin, username, password)
            values ('`+data.id_admin+`', '`+data.nama_admin+`', '`+data.username+`', '`+data.password+`')
        `
        
            // run query
            db.query(sql, data, (error, result) => {
                let response = null
                if (error) {
                    response = {
                        message: error.message
                    }
                } else {
                    response = {
                        message: result.affectedRows + " data inserted"
                    }
                }
                res.json(response) // send response
            })
    })
    
app.put("/admin/:id", (req,res) => {
    
            let data = req.body
    
            let sql = `
            update admin set
            nama_admin = '`+data.nama_admin+`', username ='`+data.username+`', password='`+data.password+`'
            where id_admin = '`+req.params.id+`'
            ` 
    
            // run query
            db.query(sql, data, (error, result) => {
                let response = null
                if (error) {
                    response = {
                        message: error.message
                    }
                } else {
                    response = {
                        message: result.affectedRows + " data updated"
                    }
                }
                res.json(response) // send response
            })
    })
    
app.delete("/admin/:id", (req,res) => {
            let data = {
                id_admin: req.params.id
            }
        let sql = `
        delete from admin
        where id_admin = '`+req.params.id+`'
        `
            db.query(sql, data, (error, result) => {
                let response = null
                if (error) {
                    response = {
                        message: error.message
                    }
                } else {
                    response = {
                        message: result.affectedRows + " data deleted"
                    }
                }
                res.json(response) // send response
            })
    })

//users

app.get("/users", (req, res) => {
        // create sql query
        let sql = "select * from users"
    
        // run query
        db.query(sql, (error, result) => {
            let response = null
            if (error) {
                response = {
                    message: error.message // pesan error
                }            
            } else {
                response = {
                    count: result.length, // jumlah data
                    users: result // isi data
                }            
            }
            res.json(response) // send response
        })
})

app.get("/users/:id", (req, res) => {
            let data = {
                id_users: req.params.id
            }
            // create sql query
            let sql = " select * from users where?"
        
            // run query
            db.query(sql, data, (error, result) => {
                let response = null
                if (error) {
                    response = {
                        message: error.message // pesan error
                    }            
                } else {
                    response = {
                        count: result.length, // jumlah data
                        users: result // isi data
                    }            
                }
                res.json(response) // send response
            })
    })
    
app.post("/users", (req,res) => {
    
            // prepare data
        let data = req.body
        
            // create sql query insert
    
        let sql = `
            insert into admin (id_users, nama_users, alamat, foto, username, password)
            values ('`+data.id_users+`', '`+data.nama_users+`', '`+data.alamat+`', '`+data.foto+`', '`+data.username+`', '`+data.password+`')
        `
        
            // run query
            db.query(sql, data, (error, result) => {
                let response = null
                if (error) {
                    response = {
                        message: error.message
                    }
                } else {
                    response = {
                        message: result.affectedRows + " data inserted"
                    }
                }
                res.json(response) // send response
            })
    })
    
app.put("/users/:id", (req,res) => {
    
            let data = req.body
    
            let sql = `
            update users set
            nama_users ='`+data.nama_users+`', alamat = '`+data.alamat+`', foto ='`+data.foto+`', username = '`+data.username+`', password'`+data.password+`'
            where id_admin = '`+req.params.id+`'
            ` 
    
            // run query
            db.query(sql, data, (error, result) => {
                let response = null
                if (error) {
                    response = {
                        message: error.message
                    }
                } else {
                    response = {
                        message: result.affectedRows + " data updated"
                    }
                }
                res.json(response) // send response
            })
    })
    
app.delete("/users/:id", (req,res) => {
            let data = {
                id_users: req.params.id
            }
        let sql = `
        delete from admin
        where id_users = '`+req.params.id+`'
        `
            db.query(sql, data, (error, result) => {
                let response = null
                if (error) {
                    response = {
                        message: error.message
                    }
                } else {
                    response = {
                        message: result.affectedRows + " data deleted"
                    }
                }
                res.json(response) // send response
            })
    })


app.listen(8000, () =>{
        console.log("Server run on port 8000");
    })