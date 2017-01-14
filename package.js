Package.describe({
  name: 'color:migrate',
  summary: 'Migrations framework for Meteor and Mongo.',
  git: 'https://github.com/coloryazilim/migrate.git',
  version: '0.0.1',
  documentation: 'README.md'
} );

Package.onUse(( api ) => {
  api.use(["ecmascript@0.6.1", "mongo@1.1.14"]);
  api.mainModule('migrate.js', 'server');
});
