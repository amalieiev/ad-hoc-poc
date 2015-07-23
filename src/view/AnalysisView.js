/**
 * Created by Artem.Malieiev on 7/14/2015.
 */
define(function (require) {
    var Backbone = require('backbone'),
        _ = require('underscore'),
        $ = require('jquery'),
        TableView = require('view/TableView'),
        DomainsCollection = require('collection/DomainsCollection'),
        DataCanvasItemsCollection = require('collection/DataCanvasItemsCollection'),
        ColumnsCollection = require('collection/ColumnsCollection'),
        FiltersView = require('view/FiltersView'),
        AxisView = require('view/AxisView'),
        ChartView = require('view/ChartView'),
        FiltersCollection = require('collection/FiltersCollection'),
        GroupsView = require('view/GroupsView'),
        GroupsCollection = require('collection/GroupsCollection'),
        AnalysisSidebarView = require('view/AnalysisSidebarView'),
        TableDataCollection = require('collection/TableDataCollection'),
        AnalysisViewTemplate = require('text!template/AnalysisViewTemplate.html');

    return Backbone.View.extend({
        className: 'analysis-view',
        template: _.template(AnalysisViewTemplate),
        events: {
            'click .editDomain': 'onEditDomainClick',
            'click .productTitle': 'onProductTitleClick',
            'click .table-view td': 'onCellClick'
        },
        initialize: function () {
            this._subviews = [];

            this.tableDataCollection = new TableDataCollection();
            this.columnsCollection = new ColumnsCollection();
            this.domainsCollection = new DomainsCollection();
            this.filtersCollection = new FiltersCollection();
            this.groupsCollection = new GroupsCollection();
            this.dataCanvasItemsCollection = new DataCanvasItemsCollection();

            this.model.collection = this.domainsCollection;

            this.listenTo(this.model, 'sync', this.onDomainSync);
            this.listenTo(this.filtersCollection, 'update', this.onConditionsUpdate);
            this.listenTo(this.groupsCollection, 'update reset', this.onConditionsUpdate);
            this.listenTo(Tamanoir, 'analysisSidebar:column:click', this.onColumnClick);

            this.model.fetch();

            this.render();
        },
        render: function () {
            this.$el.html(this.template());

            this.analysisSidebarView = new AnalysisSidebarView({collection: this.columnsCollection});
            this.tableView = new TableView({collection: this.tableDataCollection});
            this.filtersView = new FiltersView({collection: this.filtersCollection});
            this.groupsView = new GroupsView({collection: this.groupsCollection});
            this.chartView = new ChartView();
            this.axisView = new AxisView();

            this.calculateDimensions();

            this._subviews.push(this.analysisSidebarView);
            this._subviews.push(this.filtersView);
            this._subviews.push(this.tableView);
            this._subviews.push(this.groupsView);
            this._subviews.push(this.axisView);
            this._subviews.push(this.chartView);

            this.$('.top-section .sidebar-holder').html(this.analysisSidebarView.$el);
            this.$('.top-section .conditions-holder').append(this.filtersView.$el);
            this.$('.top-section .conditions-holder').append(this.groupsView.$el);
            this.$('.top-section .data-canvas-holder').append(this.axisView.$el);
            this.$('.top-section .data-canvas-holder').append(this.chartView.$el);
            this.$('.bottom-section .table-holder').html(this.tableView.$el);

            return this;
        },
        calculateDimensions: function () {
            setTimeout(function () {
                var bodyHeight = $('body').height(),
                    bodyWidth = $('body').width(),
                    sectionHeight = Math.round((bodyHeight - 40) / 2);

                this.$('.top-section').height(sectionHeight);
                this.$('.analysis-sidebar-view').height(sectionHeight);
                this.$('.data-canvas-holder').width(bodyWidth - $('.sidebar-holder').width() - $('.conditions-holder').width() - 1);
                this.$('.conditions-holder').height(sectionHeight);
                this.$('.bottom-section').height(bodyHeight - sectionHeight - 40);
            }.bind(this), 0);
        },
        onEditDomainClick: function () {
            if (this.model.get('id')) {
                Tamanoir.navigate('connection/' + this.model.get('connectionId') + '/' + this.model.get('id'), {trigger: true});
            } else {
                Tamanoir.navigate('connection/' + this.model.get('connectionId'), {trigger: true});
            }
        },
        onProductTitleClick: function () {
            Tamanoir.navigate('/', {trigger: true});
        },
        onDomainSync: function () {
            console.log('domain sync');
            this.dataCanvasItemsCollection.reset(this.model.get('data'));
            this.model.connection.query(this.buildQuery()).then(function (data) {
                this.tableDataCollection.reset(this.tableDataCollection.parseNumbers(data));
                this.columnsCollection.prepare(data, this.dataCanvasItemsCollection.getColumns());
            }.bind(this));
        },
        onCellClick: function (event) {
            console.log('cell click', event);

            var index = $(event.target).index(),
                name = $(this.$('.table-view th')[index]).find('div').text().trim(),
                value = $(event.target).text();

            this.filtersCollection.add({name: name, value: value});
        },
        onConditionsUpdate: function () {
            var query = this.buildQuery();

            console.log('query rebuild:', query);

            this.model.connection.query(query).then(function (data) {
                this.tableDataCollection.reset(this.tableDataCollection.parseNumbers(data));
            }.bind(this));
        },
        onColumnClick: function (model) {
            this.groupsCollection.reset({value: model.get('name')});
        },
        buildQuery: function () {
            var columns = this.dataCanvasItemsCollection.getColumns(),
                tables = this.dataCanvasItemsCollection.getTables(),
                conditions = this.dataCanvasItemsCollection.getConditions(),
                filters = this.filtersCollection.getFilters(),
                groups = this.groupsCollection.getGroups(),
                groupByNames = this.columnsCollection.getGroupByNames(groups, filters),
                query;

            if (groups.length) {
                query = 'SELECT ' + 'COUNT(*), ' + groups.concat(groupByNames) + ' FROM ' + tables + (conditions.concat(filters).length ? ' WHERE ' : '') + conditions.concat(filters).join(' AND ') + ' GROUP BY ' + groups + ' LIMIT 100';
            } else {
                query = 'SELECT ' + (columns.length ? columns : '*') + ' FROM ' + tables + (conditions.concat(filters).length ? ' WHERE ' : '') + conditions.concat(filters).join(' AND ') + ' LIMIT 100';
            }

            return query;
        },
        remove: function () {
            _.invoke(this._subviews, 'remove');
            Backbone.View.prototype.remove.apply(this, arguments);
        }
    });
});