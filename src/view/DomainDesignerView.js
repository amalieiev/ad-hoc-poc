/**
 * Created by Artem.Malieiev on 7/9/2015.
 */
define(function (require) {
    var Backbone = require('backbone'),
        _ = require('underscore'),
        $ = require('jquery'),
        PostgreSQLConnectionModel = require('model/PostgreSQLConnectionModel'),
        TablesView = require('view/TablesView'),
        DataCanvasView = require('view/DataCanvasView'),
        DialogView = require('view/DialogView'),
        ConnectionsCollection = require('collection/ConnectionsCollection'),
        DomainsCollection = require('collection/DomainsCollection'),
        DataCanvasItemsCollection = require('collection/DataCanvasItemsCollection'),
        TableView = require('view/TableView'),
        DomainDesignerViewTemplate = require('text!template/DomainDesignerViewTemplate.html');

    return Backbone.View.extend({
        className: 'domain-designer-view',
        template: DomainDesignerViewTemplate,
        events: {
            'click .domain-designer-title': 'onProductTitleClick',
            'click .saveDomain': 'onSaveDomainClick',
            'click .analysis': 'onAnalysisClick'
        },
        initialize: function () {
            this._subviews = [];

            this.model.collection = new DomainsCollection();
            this.tablesCollection = new Backbone.Collection();
            this.tableDataCollection = new Backbone.Collection();
            this.dataCanvasItemsCollection = new DataCanvasItemsCollection();

            this.listenTo(this.dataCanvasItemsCollection, 'change update reset', this.onCanvasItemsChange);
            this.listenTo(Tamanoir, 'tables:table:click', this.onSidebarTableClick);

            if (this.model.isNew()) {
                this.connectionModel = new PostgreSQLConnectionModel({id: this.model.get('connectionId')});
                this.connectionModel.collection = new ConnectionsCollection();
                this.listenTo(this.connectionModel, 'sync', this.onConnectionSync);
                this.connectionModel.fetch();
            } else {
                this.listenToOnce(this.model, 'sync', this.onDomainModelSync);
                this.model.fetch();
            }
        },
        render: function () {
            this.$el.html(this.template);
            this.calculateHeight();
            
            this.tablesView = new TablesView({
                database: this.connectionModel.get('database'),
                collection: this.tablesCollection
            });

            this.$('.sidebar').html(this.tablesView.$el);


            this.dataCanvasView = new DataCanvasView({collection: this.dataCanvasItemsCollection});
            this.dataCanvasItemsCollection.reset(this.model.get('data'));

            this._subviews.push(this.tablesView);
            this._subviews.push(this.dataCanvasView);

            this.$('.data-canvas-holder').html(this.dataCanvasView.$el);
            this.$('.bottom-section .table-holder').html(new TableView({collection: this.tableDataCollection}).$el);

            return this;
        },
        onConnectionSync: function () {
            Tamanoir.connecion = this.connectionModel; //Just for debug

            this.connectionModel.getTables().then(function (tables) {
                this.tablesCollection.reset(tables);
            }.bind(this));

            this.render();
        },
        onDomainModelSync: function () {
            this.connectionModel = new PostgreSQLConnectionModel({id: this.model.get('connectionId')});
            this.connectionModel.collection = new ConnectionsCollection();
            this.listenTo(this.connectionModel, 'sync', this.onConnectionSync);
            this.connectionModel.fetch();
        },
        calculateHeight: function () {
            setTimeout(function () {
                var bodyHeight = $('body').height(),
                    sectionHeight = Math.round((bodyHeight - 40) / 2);

                this.$('.top-section').height(sectionHeight);
                this.$('.sidebar').height(sectionHeight);
                this.$('.bottom-section').height(bodyHeight - sectionHeight - 40);
            }.bind(this), 0);
        },
        onProductTitleClick: function () {
            Tamanoir.navigate('/', {trigger: true});
        },
        onSidebarTableClick: function (table) {
            console.log('table clicked', table);
            this.connectionModel.query('SELECT * FROM ' + table.get('name') + ' LIMIT 100').then(function (data) {
                this.tableDataCollection.reset(data);
            }.bind(this));
        },
        onCanvasItemsChange: function () {
            console.log(this.dataCanvasView.getQuery());

            if (this.dataCanvasItemsCollection.size() === 0) {
                this.tableDataCollection.reset([]);
                return;
            }

            this.connectionModel.query(this.dataCanvasView.getQuery() + ' LIMIT 100').then(function (data) {
                this.tableDataCollection.reset(data);
            }.bind(this));

            this.$('.saveDomain').removeClass('foundicon-checkmark');
            this.$('.saveDomain').addClass('foundicon-star');
        },
        onSaveDomainClick: function (event) {
            if (this.model.isNew()) {
                var dialogView = new DialogView({
                    title: 'Save domain',
                    content: $('<input type="text" placeholder="name" name="name"/>'),
                    buttons: [{label: 'save', action: 'save'}]
                }).render();
                this.listenToOnce(dialogView, 'action:save', function () {
                    var name = dialogView.$('input').val();
                    if (name) {
                        this.model.save({
                            name: name,
                            connectionId: this.connectionModel.get('id'),
                            data: this.dataCanvasItemsCollection.toJSON()
                        }, {
                            success: function (model) {
                                Tamanoir.navigate('connection/' + model.get('connectionId') + '/' + model.get('id'));
                                this.$('.saveDomain').removeClass('foundicon-star');
                                this.$('.saveDomain').addClass('foundicon-checkmark');
                            }.bind(this)
                        });
                    }
                    dialogView.remove();
                }.bind(this));
            } else {
                this.model.save({
                    data: this.dataCanvasItemsCollection.toJSON()
                });
                this.$('.saveDomain').removeClass('foundicon-star');
                this.$('.saveDomain').addClass('foundicon-checkmark');
            }
        },
        onAnalysisClick: function () {
            if (this.model.get('id')) {
                Tamanoir.navigate('analysis/' + this.model.get('connectionId') + '/' + this.model.get('id'), {trigger: true});
            } else {
                Tamanoir.navigate('analysis/' + this.model.get('connectionId'), {trigger: true});
            }
        },
        remove: function () {
            _.invoke(this._subviews, 'remove');
            Backbone.View.prototype.remove.apply(this, arguments);
        }
    });
});