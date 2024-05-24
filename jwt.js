const fs = require("fs")
const path = require("path")
const jwt = require("jsonwebtoken")

const privateKey = fs.readFileSync(path.join(__dirname+"/key/private.key"), "utf-8")
const publicKey = fs.readFileSync(path.join(__dirname+"/key/public.key"), "utf-8")

const signOptions = {
    expiresIn: "7d",
    algorithm: "RS256"
}

function sign(payload){
    return jwt.sign(payload, privateKey, signOptions)
}

function verify(req,res,next){
    const token = req.headers["x-access-token"]
    if(!token){
        return res.status(401).send({
            auth:false,
            message:"No token provided !"
        })
    }
    jwt.verify(token,publicKey,signOptions,function(err,decoded){
        if(err){
            if(err.name=="TokenExpiredError"){
                return res.status(401).send({
                    auth:false,
                    message:"Token is Expired !"
                })
            }
            return res.status(401).send({
                auth:false,
                message:"Failed to authentication token !"
            })
        }
        req.cus_uuid=decoded.cus_uuid;
        req.cus_email=decoded.cus_email;
        next()
    })
}

module.exports={sign, verify}