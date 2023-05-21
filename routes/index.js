var express = require("express");
var router = express.Router();
const User = require("../models/User");

function filterByAgeAndDistance(persons, ageMin, ageMax, latitude, longitude, maxDistance) {
  const now = new Date();
  const thisYear = now.getFullYear();
  const RAYON_TERRE = 6371; // Rayon moyen de la Terre en kilomètres

  return persons.filter(person => {
    // Filtrage par âge
    const birthdate = new Date(person.birthdate);
    const birthYear = birthdate.getFullYear();
    const age = thisYear - birthYear;
    if (age < ageMin || age > ageMax) {
      return false;
    }

    // Filtrage par distance
    const lat1 = latitude * Math.PI / 180;
    const lon1 = longitude * Math.PI / 180;
    const lat2 = person.location.latitude * Math.PI / 180;
    const lon2 = person.location.longitude * Math.PI / 180;

    const dLat = lat2 - lat1;
    const dLon = lon2 - lon1;

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1) * Math.cos(lat2) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const distance = RAYON_TERRE * c;

    return distance <= maxDistance;
  });
}

/* GET home page. */

router.post('/propositions', (req, res) => {
  User.findOne({
    token: req.body.token,        
  })
  .then(connectedPerson => {

    const search = connectedPerson.search

  console.log(search)
  User.find({
    gender: search.genderLiked,    
    sexuality: search.sexualityLiked,
    
  })
  .then(dbData => {

    const result = filterByAgeAndDistance(
      dbData, 
      search.ageMin, 
      search.ageMax, 
      connectedPerson.location.latitude, 
      connectedPerson.location.longitude, 
      search.maxDistance);

    res.json({
      nb: result.length, result: result });
  });
});
})

module.exports = router;

