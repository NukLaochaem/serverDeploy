var express = require("express");
var router = express.Router();
const AWS = require("aws-sdk");
const s3 = new AWS.S3();

const { requiresAuth } = require("express-openid-connect");

/* GET pictures listing. */
router.get("/", requiresAuth(), async function (req, res, next) {
  var params = {
    Bucket: process.env.CYCLIC_BUCKET_NAME,
    Delimiter: "/",
    Prefix: req.oidc.user.email + "/",
  };
  var allObjects = await s3.listObjects(params).promise();
  var keys = allObjects?.Contents.map((x) => x.Key);
  const pictures = await Promise.all(
    keys.map(async (key) => {
      let my_file = await s3
        .getObject({
          Bucket: process.env.CYCLIC_BUCKET_NAME,
          Key: key,
        })
        .promise();
      return {
        src: Buffer.from(my_file.Body).toString("base64"),
        name: key.split("/").pop(),
      };
    })
  );
  res.render("pictures", { pictures: pictures });
});

router.post("/", requiresAuth(), async function (req, res, next) {
  const file = req.files.file;
  console.log(req.files);
  await s3
    .putObject({
      Body: file.data,
      Bucket: process.env.CYCLIC_BUCKET_NAME,
      Key: req.oidc.user.email + "/" + file.name,
    })
    .promise();
  res.end();
});

/*
router.get("/:pictureName", requiresAuth(), async function (req, res, next) {
  const my_file = await s3
    .getObject({
      Bucket: process.env.CYCLIC_BUCKET_NAME,
      Key: "public/" + req.params.pictureName,
    })
    .promise();

  const picture = {
    src: Buffer.from(my_file.Body).toString("base64"),
    Name: req.params.pictureName,
  };

  res.render("pictureDetails", { picture: picture });
});*/

module.exports = router;
