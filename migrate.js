class Migrations {
  constructor() {
    this.collection = new Mongo.Collection('mongo-migrations');
    this.largestOrderNumber = 0;
    this.migrations = [];
    this.verbose = false;

    // startup
    Meteor.startup(() => {

      // starting...
      this.start();
    });
  }

  add(name, migrationCallback, rollbackCallback, order) {
    let found = false;

    if ( arguments.length < 4 ) {
      order = rollbackCallback;
      rollbackCallback = null;
    }

    for ( var i = 0; i < this.migrations.length; i++ ) {
      if ( name == this.migrations[i].name ) {
        found = true
        break
      }
    }

    if ( ! found ) {
      if ( order == null ) {
        order = this.largestOrderNumber + 10
        this.largestOrderNumber = order
      } else if ( order > this.largestOrderNumber ) {
        this.largestOrderNumber = order
      }

      this.migrations.push({ migrationCallback, rollbackCallback, name, order });

      return true;
    }

    return false;
  }

  remove(name) {
    for ( var i = 0; i < this.migrations.length; i++ ) {
      if ( this.migrations[i].name == name ) {
        delete this.migrations[i];
      }
    }
  }

  update(name, newMigrationCallback, order) {
    for ( var i = 0; i < this.migrations.length; i++ ) {
      if ( name == this.migrations[i].name ) {
        if ( order == null ) {
          order = this.migrations[i].order
        } else if ( order > this.largestOrderNumber ) {
          this.largestOrderNumber = order
        }
      }

      this.migrations[i] = {
        migrationCallback: newMigrationCallback,
        name: name,
        order: order
      }
    }
  }

  rollback(name) {
    for ( var i = 0; i < this.migrations.length; i++ ) {
      if ( this.migrations[i].name == name ) {
        if ( this.migrations[i].rollbackCallback ) {
          this.migrations[i].rollbackCallback();
        }
      }
    }

    this.removeFromDatabase(name, () => {

      // restart
      this.start();
    });
  }

  removeFromDatabase(name, callback) {
    this.collection.remove({ name }, callback);
  }

  start() {
    this.migrations.sort( function ( a, b ) {
      if ( a.order < b.order ) {
        return -1;
      } else if ( a.order > b.order ) {
        return 1;
      } else {
        return 0;
      }
    });


    for ( var i = 0; i < this.migrations.length; i++ ) {
      var migration = this.migrations[i]
      // Do the migration
      var pastMigration = this.collection.findOne( {
        name : migration.name
      } )

      if ( ! pastMigration ) {
        console.log ( '> Starting ' + migration.name + ' migration.' )

        migration.migrationCallback()
        this.collection.insert({ name : migration.name });

        console.log ( '> Finishing ' + migration.name + ' migration.' )
      } else {
        if ( this.verbose ) {
          console.log( '> Skipping ' + migration.name + '.' )
        }
      }
    }
  }
}

export const Migrate = new Migrations();
