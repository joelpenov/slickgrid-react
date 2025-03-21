import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { TextExportService } from '@slickgrid-universal/text-export';

import {
  ReactGridInstance,
  Column,
  DelimiterType,
  FieldType,
  FileType,
  Filters,
  Formatter,
  Formatters,
  GridOption,
  GridStateChange,
  SlickGrid,
  ReactSlickgridCustomElement,
} from '../../slickgrid-react';
import React from 'react';
import { i18n } from 'i18next';

const NB_ITEMS = 1500;

// create a custom translate Formatter (typically you would move that a separate file, for separation of concerns)
const taskTranslateFormatter: Formatter = (_row, _cell, value, _columnDef, _dataContext, grid) => {
  const gridOptions: GridOption = (grid && typeof grid.getOptions === 'function') ? grid.getOptions() : {};

  return gridOptions.i18n?.t('TASK_X', { x: value }) ?? '';
};

interface Props { }

export default class Example12 extends React.Component {
  title = 'Example 12: Localization (i18n)';
  subTitle = `Support multiple locales with the i18next plugin, following these steps.
    Take a look at the (<a href="https://github.com/ghiscoding/slickgrid-react/wiki/Localization" target="_blank">Wiki documentation</a>)
    <ol class="small">
      <li>You first need to "enableTranslate" in the Grid Options</li>
      <li>In the Column Definitions, you have following options</li>
      <ul>
        <li>To translate a header title, use "nameKey" with a translate key (nameKey: 'TITLE')</li>
        <li>For the cell values, you need to use a Formatter, there's 2 ways of doing it</li>
        <ul>
          <li>formatter: myCustomTranslateFormatter <b>&lt;= "Title" column uses it</b></li>
          <li>formatter: Formatters.translate <b>&lt;= "Completed" column uses it</b></li>
        </ul>
      </ul>
      <li>For date localization, you need to create your own custom formatter. </li>
      <ul>
        <li>You can easily implement logic to switch between Formatters "dateIso" or "dateUs", depending on current locale.</li>
      </ul>
      <li>For the Select (dropdown) filter, you can fill in the "labelKey" property, if found it will use it, else it will use "label"</li>
        <ul>
          <li>What if your select options have totally different value/label pair? In this case, you can use the <b>customStructure: { label: 'customLabel', value: 'customValue'}</b> to change the property name(s) to use.'</li>
          <li>What if you want to use "customStructure" and translation? Simply pass this flag <b>enableTranslateLabel: true</b></li>
          <li>More info on the Select Filter <a href="https://github.com/ghiscoding/slickgrid-react/wiki/Select-Filter" target="_blank">Wiki page</a>
        </ul>
        <li>For more info about "Download to File", read the <a href="https://github.com/ghiscoding/slickgrid-react/wiki/Export-to-File" target="_blank">Wiki page</a></li>
      </ol>
    `;

  reactGrid!: ReactGridInstance;
  gridOptions!: GridOption;
  columnDefinitions: Column[] = [];
  dataset: any[] = [];
  selectedLanguage: string;
  duplicateTitleHeaderCount = 1;
  gridObj!: SlickGrid;
  excelExportService = new ExcelExportService();
  textExportService = new TextExportService();
  private i18n: i18n;

  constructor(public readonly props: Props) {
    super(props);
    // define the grid options & columns and then create the grid itself
    this.defineGrid();

    // always start with English for Cypress E2E tests to be consistent
    const defaultLang = 'en';
    this.i18n.changeLanguage(defaultLang);
    this.selectedLanguage = defaultLang;
  }

  componentDidMount() {
    document.title = this.title;
    // populate the dataset once the grid is ready
    this.getData(NB_ITEMS);
  }

  reactGridReady(reactGrid: ReactGridInstance) {
    this.reactGrid = reactGrid;
    this.gridObj = reactGrid.slickGrid;
  }

  /* Define grid Options and Columns */
  defineGrid() {
    this.columnDefinitions = [
      {
        id: 'title', name: 'Title', field: 'id', nameKey: 'TITLE', minWidth: 100,
        formatter: taskTranslateFormatter,
        sortable: true,
        filterable: true,
        params: { useFormatterOuputToFilter: true }
      },
      { id: 'description', name: 'Description', field: 'description', filterable: true, sortable: true, minWidth: 80 },
      {
        id: 'duration', name: 'Duration (days)', field: 'duration', nameKey: 'DURATION', sortable: true,
        formatter: Formatters.percentCompleteBar, minWidth: 100,
        exportWithFormatter: false,
        filterable: true,
        type: FieldType.number,
        filter: { model: Filters.slider, /* operator: '>=',*/ params: { hideSliderNumber: true } }
      },
      { id: 'start', name: 'Start', field: 'start', nameKey: 'START', formatter: Formatters.dateIso, outputType: FieldType.dateIso, type: FieldType.date, minWidth: 100, filterable: true, filter: { model: Filters.compoundDate } },
      { id: 'finish', name: 'Finish', field: 'finish', nameKey: 'FINISH', formatter: Formatters.dateIso, outputType: FieldType.dateIso, type: FieldType.date, minWidth: 100, filterable: true, filter: { model: Filters.compoundDate } },
      {
        id: 'completedBool', name: 'Completed', field: 'completedBool', nameKey: 'COMPLETED', minWidth: 100,
        sortable: true,
        formatter: Formatters.checkmark,
        exportCustomFormatter: Formatters.translateBoolean,
        filterable: true,
        filter: {
          collection: [{ value: '', label: '' }, { value: true, labelKey: 'TRUE' }, { value: false, labelKey: 'FALSE' }],
          model: Filters.singleSelect,
          enableTranslateLabel: true
        }
      },
      {
        id: 'completed', name: 'Completed', field: 'completed', nameKey: 'COMPLETED', formatter: Formatters.translate, sortable: true,
        minWidth: 100,
        exportWithFormatter: true, // you can set this property in the column definition OR in the grid options, column def has priority over grid options
        filterable: true,
        filter: {
          collection: [{ value: '', label: '' }, { value: 'TRUE', labelKey: 'TRUE' }, { value: 'FALSE', labelKey: 'FALSE' }],
          collectionSortBy: {
            property: 'labelKey', // will sort by translated value since "enableTranslateLabel" is true
            sortDesc: true
          },
          model: Filters.singleSelect,
          enableTranslateLabel: true
        }
      }
      // OR via your own custom translate formatter
      // { id: 'completed', name: 'Completed', field: 'completed', nameKey: 'COMPLETED', formatter: translateFormatter, sortable: true, minWidth: 100 }
    ];

    this.gridOptions = {
      autoResize: {
        container: '#demo-container',
        rightPadding: 10
      },
      enableAutoResize: true,
      enableExcelCopyBuffer: true,
      enableFiltering: true,
      enableTranslate: true,
      i18n: this.i18n,
      checkboxSelector: {
        // you can toggle these 2 properties to show the "select all" checkbox in different location
        hideInFilterHeaderRow: false,
        hideInColumnTitleRow: true
      },
      enableCheckboxSelector: true,
      enableRowSelection: true,
      showCustomFooter: true, // display some metrics in the bottom custom footer
      customFooterOptions: {
        metricTexts: {
          // default text displayed in the metrics section on the right
          // all texts optionally support translation keys,
          // if you wish to use that feature then use the text properties with the 'Key' suffix (e.g: itemsKey, ofKey, lastUpdateKey)
          // example "items" for a plain string OR "itemsKey" to use a translation key
          itemsKey: 'ITEMS',
          ofKey: 'OF',
          lastUpdateKey: 'LAST_UPDATE',
        },
        dateFormat: 'YYYY-MM-DD hh:mm a',
        hideTotalItemCount: false,
        hideLastUpdateTimestamp: false,
      },
      gridMenu: {
        hideExportCsvCommand: false,           // false by default, so it's optional
        hideExportTextDelimitedCommand: false  // true by default, so if you want it, you will need to disable the flag
      },
      enableExcelExport: true,
      enableTextExport: true,
      textExportOptions: {
        // set at the grid option level, meaning all column will evaluate the Formatter (when it has a Formatter defined)
        exportWithFormatter: true,
        sanitizeDataExport: true
      },
      excelExportOptions: { exportWithFormatter: true, sanitizeDataExport: true },
      registerExternalResources: [this.excelExportService, this.textExportService],
    };
  }

  getData(count: number) {
    // mock a dataset
    this.dataset = [];
    for (let i = 0; i < count; i++) {
      const randomYear = 2000 + Math.floor(Math.random() * 10);
      const randomMonth = Math.floor(Math.random() * 11);
      const randomDay = Math.floor((Math.random() * 29));

      this.dataset[i] = {
        id: i,
        description: (i % 5) ? 'desc ' + i : '🚀🦄 español', // also add some random to test NULL field
        duration: Math.round(Math.random() * 100) + '',
        start: new Date(randomYear, randomMonth, randomDay),
        finish: new Date(randomYear, (randomMonth + 1), randomDay),
        completedBool: (i % 5 === 0) ? true : false,
        completed: (i % 5 === 0) ? 'TRUE' : 'FALSE'
      };
    }
  }

  dynamicallyAddTitleHeader() {
    // you can dynamically add your column to your column definitions
    // and then use the spread operator [...cols] OR slice to force React to review the changes
    const newCol = { id: `title${this.duplicateTitleHeaderCount++}`, field: 'id', nameKey: 'TITLE', formatter: taskTranslateFormatter, sortable: true, minWidth: 100, filterable: true, params: { useFormatterOuputToFilter: true } };
    this.columnDefinitions.push(newCol);
    this.columnDefinitions = this.columnDefinitions.slice(); // or use spread operator [...cols]

    // NOTE if you use an Extensions (Checkbox Selector, Row Detail, ...) that modifies the column definitions in any way
    // you MUST use "getAllColumnDefinitions()" from the GridService, using this will be ALL columns including the 1st column that is created internally
    // for example if you use the Checkbox Selector (row selection), you MUST use the code below
    /*
    const allColumns = this.reactGrid.gridService.getAllColumnDefinitions();
    allColumns.push(newCol);
    this.columnDefinitions = [...allColumns]; // (or use slice) reassign to column definitions for React to do dirty checking
    */
  }

  exportToExcel() {
    this.excelExportService.exportToExcel({
      filename: 'Export',
      format: FileType.xlsx
    });
  }

  exportToFile(type = 'csv') {
    this.textExportService.exportToFile({
      delimiter: (type === 'csv') ? DelimiterType.comma : DelimiterType.tab,
      filename: 'myExport',
      format: (type === 'csv') ? FileType.csv : FileType.txt
    });
  }

  /** Dispatched event of a Grid State Changed event */
  gridStateChanged(gridStateChanges: GridStateChange) {
    console.log('Grid State changed:: ', gridStateChanges);
    console.log('Grid State changed:: ', gridStateChanges.change);
  }

  async switchLanguage() {
    const nextLanguage = (this.selectedLanguage === 'en') ? 'fr' : 'en';
    await this.i18n.changeLanguage(nextLanguage);
    this.selectedLanguage = nextLanguage;
  }

  render() {
    return (
      <div id="demo-container" className="container-fluid">
        <h2>
          {this.title}
          <span className="float-right">
            <a style={{ fontSize: '18px' }}
              target="_blank"
              href="https://github.com/ghiscoding/slickgrid-react/blob/master/src/examples/slickgrid/example12.ts">
              <span className="fa fa-link"></span> code
            </a>
          </span>
        </h2>
        <div className="subtitle">{this.subTitle}</div>

        <hr />

        <div className="row">
          <div className="col-sm-12">
            <button className="btn btn-outline-secondary btn-sm" data-test="language-button" onClick={this.switchLanguage}>
              <i className="fa fa-language"></i>
              Switch Language
            </button>
            <label>Locale:</label>
            <span style={{ fontStyle: 'italic;', width: '70px;' }} data-test="selected-locale">
              {this.selectedLanguage + '.json'}
            </span>

            <span style={{ marginLeft: '20px' }}>
              <button className="btn btn-outline-secondary btn-sm" onClick={() => this.exportToFile('csv')}>
                <i className="fa fa-download"></i>
                Download to CSV
              </button>
              <button className="btn btn-outline-secondary btn-sm" onClick={() => this.exportToFile('txt')}>
                <i className="fa fa-download"></i>
                Download to Text
              </button>
              <button className="btn btn-outline-secondary btn-sm" onClick={this.exportToExcel}>
                <i className="fa fa-file-excel-o text-success"></i>
                Download to Excel
              </button>
            </span>
            <span style={{ marginLeft: '10px' }}>
              <button className="btn btn-outline-secondary btn-sm" onClick={this.dynamicallyAddTitleHeader}>
                <i className="fa fa-plus"></i>
                Dynamically Duplicate Title Column
              </button>
            </span>
          </div>
        </div>
        <ReactSlickgridCustomElement gridId="grid12"
          columnDefinitions={this.columnDefinitions}
          gridOptions={this.gridOptions}
          dataset={this.dataset}
          customEvents={{
            onReactGridCreated: $event => this.reactGridReady($event.detail),
            onGridStateChanged: $event => this.gridStateChanged($event.detail),
          }} />
      </div>
    );
  }
}
