/**
 * Created by Artem.Malieiev on 7/13/2015.
 */
define(function (require) {
    var Backbone = require('backbone'),
        $ = require('jquery'),
        _ = require('underscore'),
        jsPlumb = require('jsplumb'),
        DataCanvasItemModel = require('model/DataCanvasItemModel'),
        DataCanvasViewTemplate = require('text!template/DataCanvasViewTemplate.html'),
        DataCanvasItemView = require('view/DataCanvasItemView');

    return Backbone.View.extend({
        className: 'data-canvas-view',
        template: DataCanvasViewTemplate,
        events: {
            'dragover': 'onDragOver',
            'drop': 'onDrop'
        },
        initialize: function () {
            this._subviews = [];

            this.listenTo(Tamanoir, 'tables:table:dragstart', this.onSidebarTableDragStart);
            this.listenTo(this.collection, 'update', this.render);
            this.listenTo(this.collection, 'reset', this.render);
        },
        render: function () {
            this.$el.html(this.template);

            this.plumbInstance = jsPlumb.getInstance();

            this.collection.each(this.resetMetadata, this);
            this.collection.each(this.addItem, this);

            this.calculateHeight();
            return this;
        },
        resetMetadata: function (model) {
            model.set({
                availablePlace: {top: true, bottom: true, left: true, right: true},
                position: {top: 0, left: 0}
            });
        },
        addItem: function (model, index) {
            console.log('add canvas item', model);

            var itemView = new DataCanvasItemView({model: model}),
                tableName = model.get('name'),
                relatedTableName = model.get('relatedTable'),
                relatedTable = this.collection.get(relatedTableName),
                relatedTablePosition,
                relatedTableAvailablePlace,
                anchors;

            this._subviews.push(itemView);

            this.$('.canvas-items-holder').append(itemView.$el);

            if (relatedTable) {
                relatedTablePosition = relatedTable.get('position');
                relatedTableAvailablePlace = relatedTable.get('availablePlace');

                if (relatedTableAvailablePlace.right) {
                    anchors = ['Right', 'Left'];
                    relatedTableAvailablePlace.right = false;

                    model.set({
                        position: {
                            top: relatedTablePosition.top,
                            left: relatedTablePosition.left + 300
                        }
                    }, {silent: true});

                    relatedTable.set({
                        availablePlace: relatedTableAvailablePlace
                    }, {silent: true});

                    itemView.$el.css(model.get('position'));
                } else if (relatedTableAvailablePlace.bottom) {
                    anchors = ['Bottom', 'Top'];
                    relatedTableAvailablePlace.bottom = false;

                    model.set({
                        position: {
                            top: relatedTablePosition.top + 100,
                            left: relatedTablePosition.left
                        }
                    }, {silent: true});

                    relatedTable.set({
                        availablePlace: relatedTableAvailablePlace
                    }, {silent: true});

                    itemView.$el.css(model.get('position'));
                } else if (relatedTableAvailablePlace.left) {
                    anchors = ['Left', 'Right'];
                    relatedTableAvailablePlace.left = false;

                    model.set({
                        position: {
                            top: relatedTablePosition.top,
                            left: relatedTablePosition.left - 300
                        }
                    }, {silent: true});

                    relatedTable.set({
                        availablePlace: relatedTableAvailablePlace
                    }, {silent: true});

                    itemView.$el.css(model.get('position'));
                }
            } else {
                model.set({
                    position: {
                        top: 50,
                        left: 50
                    }
                }, {silent: true});

                itemView.$el.css(model.get('position'));
            }

            (function (tableName, relatedTableName) {
                setTimeout(function () {
                    this.plumbInstance.connect({
                        target: tableName,
                        source: relatedTableName,
                        anchors: anchors,
                        connector: 'Straight',
                        paintStyle:{ strokeStyle:"#008CBA", lineWidth: 3},
                        endpointStyle:{ fillStyle:"#008CBA", radius: 3}
                    });
                }.bind(this), 0);
            }.bind(this)(tableName, relatedTableName));

            return this;
        },
        calculateHeight: function () {
            setTimeout(function () {
                console.log('data canvas rendered');
                this.$el.height(this.$el.parents('.top-section').height());
            }.bind(this), 0);
        },
        onDragOver: function (event) {
            event.preventDefault();
        },
        onDrop: function (event) {
            console.log('drop', this.draggedTableModel);
            Tamanoir.connecion.getColumns(this.draggedTableModel.get('name')).then(function (columns) {
                this.collection.add(_.extend(this.draggedTableModel.toJSON(), {
                    columns: _.map(columns, function (value) {
                        return value.name;
                    }),
                    position: {top: event.originalEvent.offsetY, left: event.originalEvent.offsetX}
                }));
            }.bind(this));
        },
        onSidebarTableDragStart: function (table) {
            console.log('dragstart', table);
            this.draggedTableModel = table;
        },
        remove: function () {
            _.invoke(this._subviews, 'remove');
            Backbone.View.prototype.remove.apply(this, arguments);
        }
    });
});