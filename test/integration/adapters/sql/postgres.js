var utils = require('utilities')
  , assert = require('assert')
  , model = require('../../../../lib')
  , helpers = require('../helpers')
  , eagerAssnTests = require('./eager_assn')
  , Adapter = require('../../../../lib/adapters/sql/postgres').Adapter
  , Generator = require('../../../../lib/generators/sql').Generator
  , generator = new Generator()
  , adapter
  , currentId
  , tests
  , config = require('../../../config')
  , shared = require('../shared')
  , unique = require('../unique_id')
  , streaming = require('../streaming');

tests = {
  'before': function (next) {
    var relations = helpers.fixtures.slice()
      , models = [];

    adapter = new Adapter(config.postgres);
    adapter.once('connect', function () {
      var sql = '';

      sql += generator.dropTable(relations);
      sql += generator.createTable(relations);

      adapter.exec(sql, function (err, data) {
        if (err) {
          throw err;
        }
        next();
      });
    });
    adapter.connect();

    model.adapters = {};
    relations.forEach(function (r) {
      model[r].adapter = adapter;
      models.push({
        ctorName: r
      });
    });

    model.registerDefinitions(models);
  }

, 'after': function (next) {
    adapter.once('disconnect', function () {
      next();
    });
    adapter.disconnect();
  }

, 'test create adapter': function () {
    assert.ok(adapter instanceof Adapter);
  }

, 'test exec': function (next) {
    adapter.exec('CREATE TABLE foo (bar varchar(256) ); DROP TABLE foo;',
        function (err, data) {
      if (err) {
        throw err;
      }
      next();
    });
  }

};

for (var p in shared) {
  if (p == 'beforeEach' || p == 'afterEach') {
    tests[p] = shared[p];
  }
  else {
    tests[p + ' (Postgres)'] = shared[p];
  }
}

for (var p in eagerAssnTests) {
  tests[p + ' (Postgres)'] = eagerAssnTests[p];
}

for (var p in unique) {
  tests[p + ' (Postgres)'] = unique[p];
}

for (var p in streaming) {
  tests[p + ' (Postgres)'] = streaming[p];
}

module.exports = tests;
