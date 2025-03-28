import { ReactGridInstance, Column, ExtensionName, Filters, Formatters, GridOption, ReactSlickgridCustomElement } from '../../slickgrid-react';
import React from 'react';

interface Props { }

export default class Example16 extends React.Component {
  title = 'Example 16: Row Move & Checkbox Selector';
  subTitle = `
    This example demonstrates using the <b>Slick.Plugins.RowMoveManager</b> plugin to easily move a row in the grid.<br/>
    <ul>
      <li>Click to select, Ctrl+Click to toggle selection, Shift+Click to select a range.</li>
      <li>Drag one or more rows by the handle (icon) to reorder</li>
      <li>If you plan to use Row Selection + Row Move, then use "singleRowMove: true" and "disableRowSelection: true"</li>
      <li>You can change "columnIndexPosition" to move the icon position of any extension (RowMove, RowDetail or RowSelector icon)</li>
      <ul>
        <li>You will also want to enable the DataView "syncGridSelection: true" to keep row selection even after a row move</li>
      </ul>
      <li>If you plan to use only Row Move, then you could keep default values (or omit them completely) of "singleRowMove: false" and "disableRowSelection: false"</li>
      <ul>
        <li>SingleRowMove has the name suggest will only move 1 row at a time, by default it will move any row(s) that are selected unless you disable the flag</li>
      </ul>
    </ul>
  `;

  reactGrid!: ReactGridInstance;
  columnDefinitions: Column[] = [];
  gridOptions!: GridOption;
  dataset: any[] = [];

  constructor(public readonly props: Props) {
    super(props);
    this.defineGrid();
  }

  reactGridReady(reactGrid: ReactGridInstance) {
    this.reactGrid = reactGrid;
  }

  get rowMoveInstance(): any {
    return this.reactGrid && this.reactGrid.extensionService.getSlickgridAddonInstance(ExtensionName.rowMoveManager) || {};
  }

  componentDidMount() {
    document.title = this.title;
    // populate the dataset once the grid is ready
    this.getData();
  }

  /* Define grid Options and Columns */
  defineGrid() {
    this.columnDefinitions = [
      { id: 'title', name: 'Title', field: 'title', filterable: true, },
      { id: 'duration', name: 'Duration', field: 'duration', filterable: true, sortable: true },
      { id: '%', name: '% Complete', field: 'percentComplete', filterable: true, sortable: true },
      {
        id: 'start', name: 'Start', field: 'start', filterable: true, sortable: true,
        filter: { model: Filters.compoundDate },
      },
      {
        id: 'finish', name: 'Finish', field: 'finish',
        filterable: true, sortable: true,
        filter: { model: Filters.compoundDate },
      },
      {
        id: 'effort-driven', name: 'Completed', field: 'effortDriven',
        formatter: Formatters.checkmark,
        filterable: true, sortable: true,
        filter: {
          collection: [{ value: '', label: '' }, { value: true, label: 'True' }, { value: false, label: 'False' }],
          model: Filters.singleSelect
        },
      }
    ];

    this.gridOptions = {
      enableAutoResize: true,
      autoResize: {
        container: '#demo-container',
        rightPadding: 10
      },
      enableFiltering: true,
      enableCheckboxSelector: true,
      checkboxSelector: {
        hideSelectAllCheckbox: false, // hide the "Select All" from title bar
        columnIndexPosition: 1,
        // you can toggle these 2 properties to show the "select all" checkbox in different location
        hideInFilterHeaderRow: false,
        hideInColumnTitleRow: true
      },
      enableRowSelection: true,
      rowSelectionOptions: {
        // True (Single Selection), False (Multiple Selections)
        selectActiveRow: false
      },
      dataView: {
        syncGridSelection: true, // enable this flag so that the row selection follows the row even if we move it to another position
      },
      enableRowMoveManager: true,
      rowMoveManager: {
        columnIndexPosition: 0,
        // when using Row Move + Row Selection, you want to move only a single row and we will enable the following flags so it doesn't cancel row selection
        singleRowMove: true,
        disableRowSelection: true,
        cancelEditOnDrag: true,
        width: 30,
        onBeforeMoveRows: this.onBeforeMoveRow.bind(this),
        onMoveRows: this.onMoveRows.bind(this),

        // you can change the move icon position of any extension (RowMove, RowDetail or RowSelector icon)
        // note that you might have to play with the position when using multiple extension
        // since it really depends on which extension get created first to know what their real position are
        // columnIndexPosition: 1,

        // you can also override the usability of the rows, for example make every 2nd row the only moveable rows,
        // usabilityOverride: (row, dataContext, grid) => dataContext.id % 2 === 1
      },
      showCustomFooter: true,
      presets: {
        // you can presets row selection here as well, you can choose 1 of the following 2 ways of setting the selection
        // by their index position in the grid (UI) or by the object IDs, the default is "dataContextIds" and if provided it will use it and disregard "gridRowIndexes"
        // the RECOMMENDED is to use "dataContextIds" since that will always work even with Pagination, while "gridRowIndexes" is only good for 1 page
        rowSelection: {
          // gridRowIndexes: [2],       // the row position of what you see on the screen (UI)
          dataContextIds: [1, 2, 6, 7]  // (recommended) select by your data object IDs
        }
      },
    };
  }

  getData() {
    // Set up some test columns.
    const mockDataset = [];
    for (let i = 0; i < 500; i++) {
      mockDataset[i] = {
        id: i,
        title: 'Task ' + i,
        duration: Math.round(Math.random() * 25) + ' days',
        percentComplete: Math.round(Math.random() * 100),
        start: '01/01/2009',
        finish: '01/05/2009',
        effortDriven: (i % 5 === 0)
      };
    }
    this.dataset = mockDataset;
  }

  onBeforeMoveRow(e: Event, data: { rows: number[]; insertBefore: number; }) {
    for (const rowIdx of data.rows) {
      // no point in moving before or after itself
      if (rowIdx === data.insertBefore || (rowIdx === data.insertBefore - 1 && ((data.insertBefore - 1) !== this.reactGrid.dataView.getItemCount()))) {
        e.stopPropagation();
        return false;
      }
    }
    return true;
  }

  onMoveRows(_e: Event, args: any) {
    // rows and insertBefore references,
    // note that these references are assuming that the dataset isn't filtered at all
    // which is not always the case so we will recalcualte them and we won't use these reference afterward
    const rows = args.rows as number[];
    const insertBefore = args.insertBefore;
    const extractedRows = [];

    // when moving rows, we need to cancel any sorting that might happen
    // we can do this by providing an undefined sort comparer
    // which basically destroys the current sort comparer without resorting the dataset, it basically keeps the previous sorting
    this.reactGrid.dataView.sort(undefined as any, true);

    // the dataset might be filtered/sorted,
    // so we need to get the same dataset as the one that the SlickGrid DataView uses
    const tmpDataset = this.reactGrid.dataView.getItems();
    const filteredItems = this.reactGrid.dataView.getFilteredItems();

    const itemOnRight = this.reactGrid.dataView.getItem(insertBefore);
    const insertBeforeFilteredIdx = itemOnRight ? this.reactGrid.dataView.getIdxById(itemOnRight.id) : this.reactGrid.dataView.getItemCount();

    const filteredRowItems: any[] = [];
    rows.forEach(row => filteredRowItems.push(filteredItems[row]));
    const filteredRows = filteredRowItems.map(item => this.reactGrid.dataView.getIdxById(item.id));

    const left = tmpDataset.slice(0, insertBeforeFilteredIdx);
    const right = tmpDataset.slice(insertBeforeFilteredIdx, tmpDataset.length);

    // convert into a final new dataset that has the new order
    // we need to resort with
    rows.sort((a: number, b: number) => a - b);
    for (const filteredRow of filteredRows) {
      if (filteredRow) {
        extractedRows.push(tmpDataset[filteredRow]);
      }
    }
    filteredRows.reverse();
    for (const row of filteredRows) {
      if (row !== undefined && insertBeforeFilteredIdx !== undefined) {
        if (row < insertBeforeFilteredIdx) {
          left.splice(row, 1);
        } else {
          right.splice(row - insertBeforeFilteredIdx, 1);
        }
      }
    }

    // final updated dataset, we need to overwrite the DataView dataset (and our local one) with this new dataset that has a new order
    const finalDataset = left.concat(extractedRows.concat(right));
    this.dataset = finalDataset; // update dataset and re-render the grid
  }

  hideDurationColumnDynamically() {
    // -- you can hide by one Id or multiple Ids:
    // hideColumnById(id, options), hideColumnByIds([ids], options)
    // you can also provide options, defaults are: { autoResizeColumns: true, triggerEvent: true, hideFromColumnPicker: false, hideFromGridMenu: false }

    this.reactGrid.gridService.hideColumnById('duration');

    // or with multiple Ids and extra options
    // this.reactGrid.gridService.hideColumnByIds(['duration', 'finish'], { hideFromColumnPicker: true, hideFromGridMenu: false });
  }

  // Disable/Enable Filtering/Sorting functionalities
  // --------------------------------------------------

  disableFilters() {
    this.reactGrid.filterService.disableFilterFunctionality(true);
  }

  disableSorting() {
    this.reactGrid.sortService.disableSortFunctionality(true);
  }

  // or Toggle Filtering/Sorting functionalities
  // ---------------------------------------------

  toggleFilter() {
    this.reactGrid.filterService.toggleFilterFunctionality();
  }

  toggleSorting() {
    this.reactGrid.sortService.toggleSortFunctionality();
  }

  render() {
    return (
      <div id="demo-container" className="container-fluid">
        <h2>
          {this.title}
          <span className="float-right">
            <a style={{ fontSize: '18px' }}
              target="_blank"
              href="https://github.com/ghiscoding/slickgrid-react/blob/master/src/examples/slickgrid/example16.ts">
              <span className="fa fa-link"></span> code
            </a>
          </span>
        </h2>
        <div className="subtitle">{this.subTitle}</div>

        <div className="row">
          <div className="col-sm-12">
            <button className="btn btn-outline-secondary btn-sm" data-test="hide-duration-btn"
              onClick={this.hideDurationColumnDynamically}>
              <i className="fa fa-eye-slash"></i>
              Dynamically Hide "Duration"
            </button>
            <button className="btn btn-outline-secondary btn-sm" data-test="disable-filters-btn"
              onClick={this.disableFilters}>
              <i className="fa fa-times"></i>
              Disable Filters
            </button>
            <button className="btn btn-outline-secondary btn-sm" data-test="disable-sorting-btn"
              onClick={this.disableSorting}>
              <i className="fa fa-times"></i>
              Disable Sorting
            </button>
            <button className="btn btn-outline-secondary btn-sm" data-test="toggle-filtering-btn" onClick={this.toggleFilter}>
              <i className="fa fa-random"></i>
              Toggle Filtering
            </button>
            <button className="btn btn-outline-secondary btn-sm" data-test="toggle-sorting-btn" onClick={this.toggleSorting}>
              <i className="fa fa-random"></i>
              Toggle Sorting
            </button>
          </div>
        </div>

        <br />

        <ReactSlickgridCustomElement gridId="grid16"
          columnDefinitions={this.columnDefinitions}
          gridOptions={this.gridOptions}
          dataset={this.dataset}
          customEvents={{
            onReactGridCreated: $event => this.reactGridReady($event.detail)
          }} />
      </div>
    );
  }
}
