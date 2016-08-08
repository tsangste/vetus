var assert = require('chai').assert
var fs = require('fs')
var path = require('path')
var rimraf = require('rimraf').sync

var testDirectory = path.join(__dirname, '..', '..', 'test-temp')

var vetus = require('./../app')({ path: testDirectory })

describe('(Basic) Conflicts', function() {

  var branchData
  var masterData

  before(function(done) {
    if (fs.existsSync(testDirectory)) {
      rimraf(testDirectory)
    }

    fs.mkdirSync(testDirectory)

    vetus.collection({name: 'test'}, function(saveCollection) {
      saveCollection.data.first = { name: 'first' }
      saveCollection.save('commit', function(err) {
        vetus.collection({name: 'test', branch: 'dev'}, function(collection) {
          collection.load(function() {
            collection.data.first = { name: 'updated' }
            collection.save('commit', function(err) {
              saveCollection.load(function() {
                saveCollection.data.first = { name: 'conflict' }
                saveCollection.data.second = { name: 'second' }
                saveCollection.save('commit2', function(err) {
                  collection.merge('master', function(err) {
                    vetus.collection({name: 'test', branch:'dev'}, function(branchCollection) {
                      branchCollection.load(function() {
                        branchData = branchCollection.data
                        vetus.collection({name: 'test'}, function(masterCollection) {
                          masterCollection.load(function() {
                            masterData = masterCollection.data
                            done()
                          })
                        })
                      })
                    })
                  })
                })
              })
            })
          })
        })
      })
    })
  })

  after(function() {
    //rimraf(testDirectory)
  })

  it('Dev and Master not merged', function(done) {
    assert(masterData.first.name !== branchData.first.name)
    done()
  })
  it('Master keeps changes', function(done) {
    assert(masterData.second.name)
    done()
  })
  it('Dev has not changed', function(done) {
    assert(!branchData.second)
    done()
  })
})
