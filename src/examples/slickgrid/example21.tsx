import { bindable } from 'react-framework';
import {
  ReactGridInstance,
  Column,
  FieldType,
  Formatters,
  GridOption,
  OperatorString,
  ReactSlickgridCustomElement
} from '../../slickgrid-react';
import React from 'react';

interface Props { }

export default class Example21 extends React.Component {
  selectedColumn!: Column;
  selectedOperator!: string;
  searchValue = '';
  title = 'Example 21: Grid AutoHeight';
  subTitle = `
  The SlickGrid option "autoHeight" can be used if you wish to keep the full height of the grid without any scrolling
  <ul>
    <li>You define a fixed grid width via "gridWidth" in the View</li>
    <li>You can still use the "autoResize" for the width to be resized automatically (the height will never change in this case)</li>
    <li>This dataset has 25 rows, if you scroll down the page you can see the entire set is shown without any grid scrolling (though you might have browser scrolling)</li>
  </ul>
  `;

  reactGrid!: ReactGridInstance;
  columnDefinitions: Column[] = [];
  gridOptions!: GridOption;
  dataset: any[] = [];
  operatorList: OperatorString[] = ['=', '<', '<=', '>', '>=', '<>', 'StartsWith', 'EndsWith'];

  constructor(public readonly props: Props) {
    super(props);
    // define the grid options & columns and then create the grid itself
    this.defineGrid();
  }

  componentDidMount() {
    document.title = this.title;
    // populate the dataset once the grid is ready
    this.getData();
  }

  /* Define grid Options and Columns */
  defineGrid() {
    this.columnDefinitions = [
      {
        id: 'title', name: 'Title', field: 'title',
        width: 100,
        sortable: true,
        type: FieldType.string
      },
      {
        id: 'duration', name: 'Duration (days)', field: 'duration',
        width: 100,
        sortable: true,
        type: FieldType.number
      },
      {
        id: 'complete', name: '% Complete', field: 'percentComplete',
        width: 100,
        formatter: Formatters.percentCompleteBar,
        type: FieldType.number
      },
      {
        id: 'start', name: 'Start', field: 'start',
        width: 100,
        formatter: Formatters.dateIso,
        sortable: true,
        type: FieldType.date
      },
      {
        id: 'finish', name: 'Finish', field: 'finish',
        width: 100,
        formatter: Formatters.dateIso, sortable: true,
        type: FieldType.date
      },
      {
        id: 'effort-driven', name: 'Effort Driven', field: 'effortDriven',
        width: 100,
        formatter: Formatters.checkmark,
        type: FieldType.number
      }
    ];

    this.gridOptions = {
      // if you want to disable autoResize and use a fixed width which requires horizontal scrolling
      // it's advised to disable the autoFitColumnsOnFirstLoad as well
      // enableAutoResize: false,
      // autoFitColumnsOnFirstLoad: false,

      autoHeight: true,
      autoResize: {
        container: '#demo-container',
        rightPadding: 10
      },

      // enable the filtering but hide the user filter row since we use our own single filter
      enableFiltering: true,
      showHeaderRow: false, // hide the filter row (header row)

      enableGridMenu: false, // disable grid menu & remove vertical scroll
      alwaysShowVerticalScroll: false,
      enableColumnPicker: true,
      enableCellNavigation: true,
      enableRowSelection: true
    };
  }

  getData() {
    // mock a dataset
    const mockedDataset = [];
    for (let i = 0; i < 25; i++) {
      const randomYear = 2000 + Math.floor(Math.random() * 10);
      const randomMonth = Math.floor(Math.random() * 11);
      const randomDay = Math.floor((Math.random() * 29));
      const randomPercent = Math.round(Math.random() * 100);

      mockedDataset[i] = {
        id: i,
        title: 'Task ' + i,
        duration: Math.round(Math.random() * 100) + '',
        percentComplete: randomPercent,
        percentCompleteNumber: randomPercent,
        start: new Date(randomYear, randomMonth, randomDay),
        finish: new Date(randomYear, (randomMonth + 1), randomDay),
        effortDriven: (i % 5 === 0)
      };
    }
    this.dataset = mockedDataset;
  }

  generatePhoneNumber() {
    let phone = '';
    for (let i = 0; i < 10; i++) {
      phone += Math.round(Math.random() * 9) + '';
    }
    return phone;
  }

  //
  // -- if any of the Search form input changes, we'll call the updateFilter() method
  //

  cleargridSearchInput() {
    this.searchValue = '';
    this.updateFilter();
  }

  selectedOperatorChanged() {
    this.updateFilter();
  }

  selectedColumnChanged() {
    this.updateFilter();
  }

  searchValueChanged() {
    this.updateFilter();
  }

  updateFilter() {
    this.reactGrid?.filterService.updateSingleFilter({
      columnId: `${this.selectedColumn.id || ''}`,
      operator: this.selectedOperator as OperatorString,
      searchTerms: [this.searchValue || '']
    });
  }

  render() {
    return (
      <div id="demo-container" className="container-fluid">
        <h2>
          {this.title}
          <span className="float-right">
            <a style={{ fontSize: '18px' }}
              target="_blank"
              href="https://github.com/ghiscoding/slickgrid-react/blob/master/src/examples/slickgrid/example21.ts">
              <span className="fa fa-link"></span> code
            </a>
          </span>
        </h2>
        <div className="subtitle">{this.subTitle}</div>

        <div className="row row-cols-lg-auto g-1 align-items-center">
          <div className="col">
            <label htmlFor="columnSelect">Single Search:</label>
          </div>
          <div className="col">
            <select className="form-select" data-test="search-column-list" name="selectedColumn"
              value="selectedColumn" id="columnSelect">
              {
                routes.map((column) =>
                  <option key={column.route}
                    value="column">
                    {column.name}
                  </option>
                )
              }
            </select>
          </div>
          <div className="col">
            <select value="selectedOperator"
              className="form-select"
              data-test="search-operator-list">
              {
                routes.map((operator) =>
                  <option key={operator.route}
                    value="operator">
                    {operator}
                  </option>
                )
              }
            </select>
          </div>

          <div className="col">
            <div className="input-group">
              <input type="text"
                className="form-control"
                placeholder="search value"
                data-test="search-value-input"
                value="searchValue" />
              <button className="btn btn-outline-secondary d-flex align-items-center pl-2 pr-2" data-test="clear-search-value"
                onClick={this.cleargridSearchInput}>
                <span className="fa fa-times"></span>
              </button>
            </div>
          </div>
        </div >

        <hr />

        <ReactSlickgridCustomElement gridId="grid21"
          columnDefinitions={this.columnDefinitions}
          gridOptions={this.gridOptions}
          dataset={this.dataset}
          instances={this.reactGrid} />
      </div >
    );
  }
}
