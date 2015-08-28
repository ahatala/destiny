var express = require('express');
var router = express.Router();
var destiny = require('destiny-client')();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Destiny' });
});

var destinyImageResourcePath = "http://www.bungie.net/"

var characterClass = 
{
    0 : "Titan",
    1 : "Hunter",
    2 : "Warlock"
};

var weaponSlots =
[
    "Primary Weapons",
    "Special Weapons",
    "Heavy Weapons",
];

var itemNames = {}

function populateItems() {
}

function processError(res, err) {
    console.error(err);
    res.send('<h2>' + err.toString() + '</h2>');
}

function getAccount(users) {
    if (users.length == 0)
        throw new Error("User not found");
    return destiny.Account(users[0]);
}

function getInventory(response) {
    var characters = response.data.characters;
    return Promise.all(characters.map(
        function(char) {
            char.characterBase.definitions = "true";
            return destiny.Inventory(char.characterBase).then(function(inventory) {
                char.inventory = inventory;
                return char;
            })
        }));
}

function extractCharacterInfo(char) {

    var equippable = char.inventory.data.buckets.Equippable;
    var info = {
        level : char.characterLevel,
        clazz : characterClass[char.characterBase.classType],
        emblemPath : destinyImageResourcePath + char.emblemPath,
        weapons : []
    };
    for (i = 0; i < equippable.length; i++) {
        var slotIdx = weaponSlots.indexOf(char.inventory.definitions.buckets[equippable[i].bucketHash].bucketName);
        if (slotIdx < 0)
            continue;
        for (j = 0; j < equippable[i].items.length; j++) {
            var item = equippable[i].items[j];
            if (item.isEquipped) {
                var itemDef = char.inventory.definitions.items[item.itemHash];
                info.weapons[slotIdx] = { icon : destinyImageResourcePath + itemDef.icon, text : itemDef.itemName };
            }
        }
    }
    
    return info;
}

function renderCharacters(res, characters) {

    var charInfo = characters.map(extractCharacterInfo)
    res.render('characters', { characters: characters.map(extractCharacterInfo) }, function(err, html) {
        if (err)
            throw err;
        res.send(html);
    });
}

router.get('/userdata', function(req, res, next) {
    var val = req.query.username;
    console.log('getting user data for ' + val);
    destiny
        .Search({ membershipType: 'All', name: val })
        .then(getAccount)
        .then(getInventory)
        .then(function(data) { renderCharacters(res, data); })
        .then(null, function(err) { processError(res, err); });
});


module.exports = router;
