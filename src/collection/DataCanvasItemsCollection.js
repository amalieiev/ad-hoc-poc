/**
 * Created by Artem.Malieiev on 7/13/2015.
 */
define(function (require) {
    var Backbone = require('backbone'),
        _ = require('underscore'),
        $ = require('jquery'),
        DataCanvasItemModel = require('model/DataCanvasItemModel');

    return Backbone.Collection.extend({
        model: DataCanvasItemModel,
        getColumnMatches: function () {
            var matches = {};
            _.each(this.toJSON(), function (canvasItem) {
                _.each(canvasItem.columns, function (columnName) {
                    if (matches[columnName]) {
                        matches[columnName].push(canvasItem.name);
                    } else {
                        matches[columnName] = [canvasItem.name];
                    }
                }.bind(this));
            }.bind(this));
            return matches;
        },
        getColumns: function () {
            var columns = [];
            _.each(this.toJSON(), function (value) {
                columns = columns.concat(value.selected);
            }, this);
            return columns;
        },
        getTables: function () {
            return this.map(function (value) {
                return value.get('name');
            });
        },
        getConditions: function () {
            var matches = {},
                alreadyMathed = {},
                conditions = [];
            _.each(this.toJSON(), function (canvasItem) {
                _.each(canvasItem.columns, function (columnName) {
                    if (matches[columnName]) {
                        var t1 = canvasItem.name,
                            t2 = matches[columnName][0];

                        if (!alreadyMathed[t1]) {
                            alreadyMathed[t1] = {};
                        }

                        alreadyMathed[t1][t2] = columnName;
                    } else {
                        matches[columnName] = [canvasItem.name];
                    }
                }.bind(this));
            }.bind(this));

            _.each(alreadyMathed, function (value, key) {
                conditions.push(key + '.' + _.values(value)[0] + ' = ' + _.keys(value)[0] + '.' +  _.values(value)[0]);
            }.bind(this));

            return conditions;
        },
        getRelations: function () {
            var matches = {},
                alreadyMathed = {};
            _.each(this.toJSON(), function (canvasItem) {
                _.each(canvasItem.columns, function (columnName) {
                    if (matches[columnName]) {
                        var t1 = canvasItem.name,
                            t2 = matches[columnName][0];

                        if (!alreadyMathed[t1]) {
                            alreadyMathed[t1] = {};
                        }

                        alreadyMathed[t1][t2] = columnName;
                    } else {
                        matches[columnName] = [canvasItem.name];
                    }
                }.bind(this));
            }.bind(this));

            return alreadyMathed;
        }
    });
});