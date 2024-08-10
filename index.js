const express = require('express')
const app = express()
const cors = require("cors");
const bodyParser = require('body-parser');
app.use(express.json());
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
const path = require("path")
app.use("/image", express.static(path.join(__dirname, "./assets/")))
const useType=require('./api/setting/api-type-gold');
const useOption=require('./api/setting/api-option');
const useProvice=require('./api/setting/api-province')
const useDistrict=require('./api/setting/api-district')
const usePattern=require('./api/data/api-pattern');
const useUser=require('./api/setting/api-users');
const useZone=require('./api/setting/api-zone');
const useUnite =require('./api/setting/api-unite');
const usePrice=require('./api/setting/api-set-price');
const useStaff=require('./api/data/api-staff');
const useTileps=require('./api/data/api-tilePorduct');
const usePorduct =require('./api/data/api-products');
const useReceived=require('./api/data/api-received');
const useOrder=require('./api/data/api-orders');
const useReportSale=require('./api/reports/report-sale-daily');
const useCustomer=require('./api/data/api-customer');
const useStock=require('./api/reports/report-stock')
const useHome=require('./api/reports/fetch-data-home');
const useSystem=require('./api/setting/api-system-shop');
const useSearch=require('./api/data/search-data');
const useSlider=require('./api/website/api-slider');
const usePromotion=require('./api/website/api-promotion');
const useNewevent=require('./api/website/api-newevent');
const useGift=require('./api/website/api-gift-memory')
const useLogin=require('./api/checklogin');
const useRate=require('./api/setting/api-rateChange');
const useJob=require('./api/website/api-apply-job');
const useRecd=require('./api/website/api-recommended')
//===================== use router
app.use('/type',useType);
app.use('/option',useOption);
app.use('/province',useProvice);
app.use('/district',useDistrict);
app.use('/pattern',usePattern);
app.use('/user',useUser);
app.use('/zone',useZone);
app.use('/unite',useUnite);
app.use('/price',usePrice);
app.use('/staff',useStaff);
app.use('/tileps',useTileps);
app.use('/posd',usePorduct);
app.use('/received',useReceived);
app.use('/order',useOrder);
app.use('/sale-r',useReportSale);
app.use('/customer',useCustomer);
app.use('/stock',useStock);
app.use('/home',useHome);
app.use('/system',useSystem);
app.use('/login',useLogin);
app.use('/search',useSearch);

app.use('/slider',useSlider);
app.use('/promotion',usePromotion);
app.use('/news',useNewevent);
app.use('/gift',useGift);
app.use('/rate',useRate);
app.use('/job',useJob);
app.use('/recd',useRecd);
const PORT = process.env.PORT || 3091;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});