const express = require('express');
const router = express.Router();
const db = require('./db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const moment = require('moment');
const currentDatetime = moment();
const dateTime = currentDatetime.format('YYYY-MM-DD HH:mm:ss');
router.post("/check", function(req, res) {
    const table = 'tbl_user_acount'; 
    const userPass = req.body.userPass; 
    const userEmail = req.body.userEmail;
    const fields = "user_Id, user_uuid,branch_Id_fk, userName, userEmail, userPassword"; 
    const where = `userEmail = '${userEmail}'`; 
    db.fetchSingle(table, fields, where, (err, results) => {
        if (err) {
            return res.status(400)
            .json({
                status: "400",
                message: "ຊື່ອີເມວບໍ່ຖືກຕ້ອງ"
            });
        }
        bcrypt.compare(userPass, results.userPassword, (bcryptErr, bcryptResult) => {
            if (bcryptErr || !bcryptResult) {
                return res.status(400)
                .json({
                    status: "400",
                    message: "ຫັດຜ່ານບໍ່ຖືກຕ້ອງ"
                });
            }

            // Sign a new JWT token
            const payload = {
                user_uuid: results.user_uuid,
                userEmail: results.userEmail,
                create_date: dateTime
            };
            jwt.sign(payload, 'your_secret_key',{ expiresIn: '1h' }, (signErr, token) => {
                if (signErr) {
                    return res.status(500).json({
                        status: "500",
                        message: "ເຊີບເວີພາຍໃນມີການຜິດພາດ"
                    });
                }
                res.status(200).json({
                    status: "200",
                    message: "ການເຂົ້າສູ້ລະບົບໄດສຳເລັດແລ້ວ",
                    token: token,
                    user_uuid: results.user_uuid,
                    userEmail: results.userEmail,
                    username: results.userName,
                    branch_Id: results.branch_Id_fk
                });
            });
        });
    });
});

router.post("/authen", function(req, res, next) {
    const token = req.headers.authorization;
    if (!token) {
        return res.status(401).json({
            status: "401",
            message: "Authorization token is missing"
        });
    }

    jwt.verify(token, 'your_secret_key', (verifyErr, decoded) => {
        if (verifyErr) {
            return res.status(401).json({
                status: "4011",
                message: "Invalid token"
            });
        }
        const userId = decoded.user_uuid;
        const userEmail = decoded.userEmail; 
         res.status(200).json({
            status:'OK',
            userId:userId,
            userEmail:userEmail
         })
    });
});
module.exports = router;
