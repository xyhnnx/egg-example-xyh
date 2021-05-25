const MongoUtil = require('../../app/util/mongo')
async function getList(docId) {

  // test
  let collectionName = 'examStudentStat'

  // localhost
  // let collectionName = 't_answer_all'

  let mongo = new MongoUtil('analysis_prod')
  let client = mongo.client;

  let pageSize = 1000
  let res
  try {
    await client.connect()
    const db = client.db();
    const collection = db.collection(collectionName)
    console.log('docId',docId)
    if(docId) {
      res = await collection.find({
        $where: "this.fullMark == this.totalScore",
        _id:{$gt: docId}
      }).sort({_id: 1}).limit(pageSize).toArray()
    } else {
      res = await collection.find({
        $where: "this.fullMark == this.totalScore"
      }).sort({_id: 1}).limit(pageSize).toArray()
    }
  } finally {
    client.close();
  }
  return res
}
async function getData() {
  let docId;
  for(let i =1;i<=1;i++) {
    let date1 = Date.now()
    console.log(`----------------${i}----------------`)
    let res = await getList(docId)
    docId = res[0]._id
    console.log(docId)
    let list = res.map(e=>{
      return {
        name: e.studentName
      }
    })
    let mongo = new MongoUtil('xyh_test')
    await mongo.insertMany(list, 'nameProd')
    console.log(`----------------${i}---${(Date.now() - date1)/1000}s-------------`)
  }
}
getData()
