import { ExcelExportService } from '@slickgrid-universal/excel-export';
import {
  ReactGridInstance,
  Column,
  FieldType,
  Filters,
  Formatters,
  GridOption,
  findItemInTreeStructure,
  Formatter,
  ReactSlickgridCustomElement
} from '../../slickgrid-react';
import React from 'react';
import './example28.scss'; // provide custom CSS/SASS styling

interface Props { }

export default class Example28 extends React.Component {
  title = 'Example 28: Tree Data <small>(from a Hierarchical Dataset)</small>';
  subTitle = `<ul>
    <li><b>NOTE:</b> The grid will automatically sort Ascending with the column that has the Tree Data, you could add a "sortByFieldId" in your column "treeData" option if you wish to sort on a different column</li>
    <li><b>Styling - Salesforce Theme</b></li>
    <ul>
      <li>The Salesforce Theme was created with SASS and compiled in CSS (<a href="https://github.com/ghiscoding/slickgrid-universal/blob/master/packages/common/src/styles/slickgrid-theme-salesforce.scss" target="_blank">slickgrid-theme-salesforce.scss</a>), you can override any of its SASS variables</li>
      <li>We use a small subset of <a href="https://materialdesignicons.com/" target="_blank">Material Design Icons</a></li>
      <li>you might need to refresh the page to clear the browser cache and see the correct theme</li>
    </ul>
  `;
  reactGrid!: ReactGridInstance;
  gridOptions!: GridOption;
  columnDefinitions: Column[] = [];
  datasetHierarchical: any[] = [];
  searchString = '';

  constructor(public readonly props: Props) {
    super(props);
    // define the grid options & columns and then create the grid itself
    this.defineGrid();
  }

  componentDidMount() {
    document.title = this.title;
    // populate the dataset once the grid is ready
    this.datasetHierarchical = this.mockDataset();
  }

  /* Define grid Options and Columns */
  defineGrid() {
    this.columnDefinitions = [
      {
        id: 'file', name: 'Files', field: 'file',
        type: FieldType.string, width: 150, formatter: this.treeFormatter,
        filterable: true, sortable: true,
      },
      {
        id: 'dateModified', name: 'Date Modified', field: 'dateModified',
        formatter: Formatters.dateIso, type: FieldType.dateUtc, outputType: FieldType.dateIso, minWidth: 90,
        exportWithFormatter: true, filterable: true, filter: { model: Filters.compoundDate }
      },
      {
        id: 'size', name: 'Size', field: 'size', minWidth: 90,
        type: FieldType.number, exportWithFormatter: true,
        filterable: true, filter: { model: Filters.compoundInputNumber },
        formatter: (_row, _cell, value) => isNaN(value) ? '' : `${value || 0} MB`,
      },
    ];

    this.gridOptions = {
      autoResize: {
        container: '#demo-container',
        rightPadding: 10
      },
      enableAutoSizeColumns: true,
      enableAutoResize: true,
      enableFiltering: true,
      enableTreeData: true, // you must enable this flag for the filtering & sorting to work as expected
      multiColumnSort: false,
      treeDataOptions: {
        columnId: 'file',
        childrenPropName: 'files',
        // you can optionally sort by a different column and/or sort direction
        // initialSort: {
        //   columnId: 'file',
        //   direction: 'DESC'
        // }
      },
      // change header/cell row height for salesforce theme
      headerRowHeight: 35,
      rowHeight: 33,
      enableExcelExport: true,
      registerExternalResources: [new ExcelExportService()],

      // use Material Design SVG icons
      contextMenu: {
        iconCollapseAllGroupsCommand: 'mdi mdi-arrow-collapse',
        iconExpandAllGroupsCommand: 'mdi mdi-arrow-expand',
        iconClearGroupingCommand: 'mdi mdi-close',
        iconCopyCellValueCommand: 'mdi mdi-content-copy',
        iconExportCsvCommand: 'mdi mdi-download',
        iconExportExcelCommand: 'fa fa-file-excel-o mdi mdi-file-excel-outline',
        iconExportTextDelimitedCommand: 'mdi mdi-download',
      },
      gridMenu: {
        iconCssClass: 'mdi mdi-menu',
        iconClearAllFiltersCommand: 'mdi mdi-filter-remove-outline',
        iconClearAllSortingCommand: 'mdi mdi-swap-vertical',
        iconExportCsvCommand: 'mdi mdi-download',
        iconExportExcelCommand: 'mdi mdi-file-excel-outline',
        iconExportTextDelimitedCommand: 'mdi mdi-download',
        iconRefreshDatasetCommand: 'mdi mdi-sync',
        iconToggleFilterCommand: 'mdi mdi-flip-vertical',
        iconTogglePreHeaderCommand: 'mdi mdi-flip-vertical',
      },
      headerMenu: {
        iconClearFilterCommand: 'mdi mdi mdi-filter-remove-outline',
        iconClearSortCommand: 'mdi mdi-swap-vertical',
        iconSortAscCommand: 'mdi mdi-sort-ascending',
        iconSortDescCommand: 'mdi mdi-flip-v mdi-sort-descending',
        iconColumnHideCommand: 'mdi mdi-close',
      }
    };
  }

  clearSearch() {
    this.searchString = '';
  }

  searchStringChanged() {
    this.updateFilter();
  }

  updateFilter() {
    this.reactGrid.filterService.updateFilters([{ columnId: 'file', searchTerms: [this.searchString] }], true, false, true);
  }

  treeFormatter: Formatter = (_row, _cell, value, _columnDef, dataContext, grid) => {
    const gridOptions = grid.getOptions() as GridOption;
    const treeLevelPropName = gridOptions.treeDataOptions && gridOptions.treeDataOptions.levelPropName || '__treeLevel';
    if (value === null || value === undefined || dataContext === undefined) {
      return '';
    }
    const dataView = grid.getData();
    const data = dataView.getItems();
    const identifierPropName = dataView.getIdPropertyName() || 'id';
    const idx = dataView.getIdxById(dataContext[identifierPropName]) as number;
    const prefix = this.getFileIcon(value);

    value = value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const spacer = `<span style="display:inline-block; width:${(15 * dataContext[treeLevelPropName])}px;"></span>`;

    if (data[idx + 1] && data[idx + 1][treeLevelPropName] > data[idx][treeLevelPropName]) {
      const folderPrefix = `<span class="mdi icon color-alt-warning ${dataContext.__collapsed ? 'mdi-folder' : 'mdi-folder-open'}"></span>`;
      if (dataContext.__collapsed) {
        return `${spacer} <span class="slick-group-toggle collapsed" level="${dataContext[treeLevelPropName]}"></span>${folderPrefix} ${prefix}&nbsp;${value}`;
      } else {
        return `${spacer} <span class="slick-group-toggle expanded" level="${dataContext[treeLevelPropName]}"></span>${folderPrefix} ${prefix}&nbsp;${value}`;
      }
    } else {
      return `${spacer} <span class="slick-group-toggle" level="${dataContext[treeLevelPropName]}"></span>${prefix}&nbsp;${value}`;
    }
  }

  getFileIcon(value: string) {
    let prefix = '';
    if (value.includes('.pdf')) {
      prefix = '<span class="mdi icon mdi-file-pdf-outline color-danger"></span>';
    } else if (value.includes('.txt')) {
      prefix = '<span class="mdi icon mdi-file-document-outline color-muted-light"></span>';
    } else if (value.includes('.xls')) {
      prefix = '<span class="mdi icon mdi-file-excel-outline color-succes"></span>';
    } else if (value.includes('.mp3')) {
      prefix = '<span class="mdi icon mdi-file-music-outline color-info"></span>';
    }
    return prefix;
  }

  /**
   * A simple method to add a new item inside the first group that we find.
   * After adding the item, it will sort by parent/child recursively
   */
  addNewFile() {
    const newId = this.reactGrid.dataView.getLength() + 100;

    // find first parent object and add the new item as a child
    const tmpDatasetHierarchical = [...this.datasetHierarchical];
    const popItem = findItemInTreeStructure(tmpDatasetHierarchical, x => x.file === 'pop', 'files');

    if (popItem && Array.isArray(popItem.files)) {
      popItem.files.push({
        id: newId,
        file: `pop-${newId}.mp3`,
        dateModified: new Date(),
        size: Math.round(Math.random() * 100),
      });

      // overwrite hierarchical dataset which will also trigger a grid sort and rendering
      this.datasetHierarchical = tmpDatasetHierarchical;

      // scroll into the position, after insertion cycle, where the item was added
      setTimeout(() => {
        const rowIndex = this.reactGrid.dataView.getRowById(popItem.id) as number;
        this.reactGrid.slickGrid.scrollRowIntoView(rowIndex + 3);
      }, 10);
    }
  }

  collapseAll() {
    this.reactGrid.treeDataService.toggleTreeDataCollapse(true);
  }

  expandAll() {
    this.reactGrid.treeDataService.toggleTreeDataCollapse(false);
  }

  logHierarchicalStructure() {
    console.log('exploded array', this.reactGrid.treeDataService.datasetHierarchical /* , JSON.stringify(explodedArray, null, 2) */);
  }

  logFlatStructure() {
    console.log('flat array', this.reactGrid.treeDataService.dataset /* , JSON.stringify(outputFlatArray, null, 2) */);
  }

  mockDataset() {
    return [
      { id: 24, file: 'bucket-list.txt', dateModified: '2012-03-05T12:44:00.123Z', size: 0.5 },
      { id: 18, file: 'something.txt', dateModified: '2015-03-03T03:50:00.123Z', size: 90 },
      {
        id: 21, file: 'documents', files: [
          { id: 2, file: 'txt', files: [{ id: 3, file: 'todo.txt', dateModified: '2015-05-12T14:50:00.123Z', size: 0.7, }] },
          {
            id: 4, file: 'pdf', files: [
              { id: 22, file: 'map2.pdf', dateModified: '2015-07-21T08:22:00.123Z', size: 2.9, },
              { id: 5, file: 'map.pdf', dateModified: '2015-05-21T10:22:00.123Z', size: 3.1, },
              { id: 6, file: 'internet-bill.pdf', dateModified: '2015-05-12T14:50:00.123Z', size: 1.4, },
              { id: 23, file: 'phone-bill.pdf', dateModified: '2015-05-01T07:50:00.123Z', size: 1.4, },
            ]
          },
          { id: 9, file: 'misc', files: [{ id: 10, file: 'todo.txt', dateModified: '2015-02-26T16:50:00.123Z', size: 0.4, }] },
          { id: 7, file: 'xls', files: [{ id: 8, file: 'compilation.xls', dateModified: '2014-10-02T14:50:00.123Z', size: 2.3, }] },
        ]
      },
      {
        id: 11, file: 'music', files: [{
          id: 12, file: 'mp3', files: [
            { id: 16, file: 'rock', files: [{ id: 17, file: 'soft.mp3', dateModified: '2015-05-13T13:50:00Z', size: 98, }] },
            {
              id: 14, file: 'pop', files: [
                { id: 15, file: 'theme.mp3', dateModified: '2015-03-01T17:05:00Z', size: 47, },
                { id: 25, file: 'song.mp3', dateModified: '2016-10-04T06:33:44Z', size: 6.3, }
              ]
            },
          ]
        }]
      },
    ];
  }

  render() {
    return (
      <div id="demo-container" className="container-fluid">
        <h2>
          <span>{this.title}</span>
          <span className="float-right">
            <a style={{ fontSize: '18px' }}
              target="_blank"
              href="https://github.com/ghiscoding/slickgrid-react/blob/master/src/examples/slickgrid/example28.ts">
              <span className="mdi mdi-link mdi-v-align-sub"></span> code
            </a>
          </span>
        </h2>
        <div className="subtitle">{this.subTitle}</div>

        <div className="row">
          <div className="col-md-7">
            <button onClick={this.addNewFile} data-test="add-item-btn" className="btn btn-sm btn-primary">
              <span className="mdi mdi-plus color-white"></span>
              <span>Add New Pop Song</span>
            </button>
            <button onClick={this.collapseAll} data-test="collapse-all-btn" className="btn btn-outline-secondary btn-sm">
              <span className="mdi mdi-arrow-collapse"></span>
              <span>Collapse All</span>
            </button>
            <button onClick={this.expandAll} data-test="expand-all-btn" className="btn btn-outline-secondary btn-sm">
              <span className="mdi mdi-arrow-expand"></span>
              <span>Expand All</span>
            </button>
            <button onClick={this.logFlatStructure} className="btn btn-outline-secondary btn-sm">
              <span>Log Flat Structure</span>
            </button>
            <button onClick={this.logHierarchicalStructure} className="btn btn-outline-secondary btn-sm">
              <span>Log Hierarchical Structure</span>
            </button>
          </div>

          <div className="col-md-5">
            <div className="input-group input-group-sm">
              <input type="text" className="form-control search-string" data-test="search-string" value={this.searchString} />
              <button className="btn btn-sm btn-outline-secondary d-flex align-items-center" data-test="clear-search-string"
                onClick={this.clearSearch}>
                <span className="icon mdi mdi-close-thick"></span>
              </button>
            </div>
          </div>
        </div>

        <br />

        <div id="grid-container" className="col-sm-12">
          <ReactSlickgridCustomElement gridId="grid28"
            columnDefinitions={this.columnDefinitions}
            gridOptions={this.gridOptions}
            datasetHierarchical={this.datasetHierarchical}
            instances={this.reactGrid} />
        </div>
      </div>
    );
  }
}
