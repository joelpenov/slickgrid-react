import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { i18n } from 'i18next';

import {
  ReactGridInstance,
  Column,
  ContextMenu,
  ExtensionName,
  FieldType,
  Filters,
  Formatter,
  Formatters,
  GridOption,
  SlickGrid,
  ReactSlickgridCustomElement,
} from '../../slickgrid-react';
import React from 'react';
import './example24.scss'; // provide custom CSS/SASS styling

const actionFormatter: Formatter = (_row, _cell, _value, _columnDef, dataContext) => {
  if (dataContext.priority === 3) { // option 3 is High
    return `<div class="fake-hyperlink">Action <i class="fa fa-caret-down"></i></div>`;
  }
  return `<div class="disabled">Action <i class="fa fa-caret-down"></i></div>`;
};

const priorityFormatter: Formatter = (_row, _cell, value) => {
  if (!value) {
    return '';
  }
  let output = '';
  const count = +(value >= 3 ? 3 : value);
  const color = count === 3 ? 'red' : (count === 2 ? 'orange' : 'yellow');
  const icon = `<i class="fa fa-star ${color}" aria-hidden="true"></i>`;

  for (let i = 1; i <= count; i++) {
    output += icon;
  }
  return output;
};

const priorityExportFormatter: Formatter = (_row, _cell, value, _columnDef, _dataContext, grid) => {
  if (!value) {
    return '';
  }
  const gridOptions: GridOption = (grid && typeof grid.getOptions === 'function') ? grid.getOptions() : {};
  const i18n = gridOptions.i18n;
  const count = +(value >= 3 ? 3 : value);
  const key = count === 3 ? 'HIGH' : (count === 2 ? 'MEDIUM' : 'LOW');

  return i18n?.t(key) ?? '';
};

// create a custom translate Formatter (typically you would move that a separate file, for separation of concerns)
const taskTranslateFormatter: Formatter = (_row, _cell, value, _columnDef, _dataContext, grid: SlickGrid) => {
  const gridOptions: GridOption = (grid && typeof grid.getOptions === 'function') ? grid.getOptions() : {};
  const i18n = gridOptions.i18n;

  return i18n?.t('TASK_X', { x: value }) ?? '';
};

interface Props { }

export default class Example24 extends React.Component {
  title = 'Example 24: Cell Menu & Context Menu Plugins';
  subTitle = `Add Cell Menu and Context Menu
    <ul>
      <li>This example demonstrates 2 SlickGrid plugins
      <ol>
        <li>Using the <b>Slick.Plugins.CellMenu</b> plugin, often used for an Action Menu(s), 1 or more per grid
          (<a href="https://github.com/ghiscoding/slickgrid-react/wiki/Cell-Menu" target="_blank">Wiki docs</a>).
        </li>
        <li>Using the <b>Slick.Plugins.ContextMenu</b> plugin, shown after a mouse right+click, only 1 per grid.
        (<a href="https://github.com/ghiscoding/slickgrid-react/wiki/Context-Menu" target="_blank">Wiki docs</a>).
        </li>
      </ol>
      <li>It will also "autoAdjustDrop" (bottom/top) and "autoAlignSide" (left/right) by default but could be turned off</li>
      <li>Both plugins have 2 sections, 1st section can have an array of Options (to change value of a field) and 2nd section an array of Commands (execute a command)</li>
      <li>There are 2 ways to execute a Command/Option</li>
      <ol>
        <li>via onCommand/onOptionSelected (use a switch/case to parse command/option and do something with it)</li>
        <li>via action callback (that can be defined on each command/option)</li>
      </ol>
      <li>Use override callback functions to change the properties of show/hide, enable/disable the menu or certain item(s) from the list</li>
      <ol>
        <li>These callbacks are: "menuUsabilityOverride", "itemVisibilityOverride", "itemUsabilityOverride"</li>
        <li>... e.g. in the demo, the "Action" Cell Menu is only available when Priority is set to "High" via "menuUsabilityOverride"</li>
        <li>... e.g. in the demo, the Context Menu is only available on the first 20 Tasks via "menuUsabilityOverride"</li>
      </ol>
    </ul>`;

  reactGrid!: ReactGridInstance;
  gridOptions!: GridOption;
  columnDefinitions: Column[] = [];
  dataset: any[] = [];
  selectedLanguage: string;
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

  get cellMenuInstance(): any {
    return this.reactGrid && this.reactGrid.extensionService.getSlickgridAddonInstance(ExtensionName.cellMenu) || {};
  }

  get contextMenuInstance(): any {
    return this.reactGrid && this.reactGrid.extensionService.getSlickgridAddonInstance(ExtensionName.contextMenu) || {};
  }

  componentDidMount() {
    document.title = this.title;
    // populate the dataset once the grid is ready
    this.dataset = this.getData(1000);
  }

  /* Define grid Options and Columns */
  defineGrid() {
    this.columnDefinitions = [
      { id: 'id', name: '#', field: 'id', maxWidth: 45, sortable: true, filterable: true },
      {
        id: 'title', name: 'Title', field: 'id', nameKey: 'TITLE', minWidth: 100,
        formatter: taskTranslateFormatter,
        sortable: true,
        filterable: true,
        params: { useFormatterOuputToFilter: true }
      },
      {
        id: 'percentComplete', nameKey: 'PERCENT_COMPLETE', field: 'percentComplete', minWidth: 100,
        exportWithFormatter: false,
        sortable: true, filterable: true,
        filter: { model: Filters.slider, operator: '>=' },
        formatter: Formatters.percentCompleteBar, type: FieldType.number,
      },
      {
        id: 'start', name: 'Start', field: 'start', nameKey: 'START', minWidth: 100,
        formatter: Formatters.dateIso, outputType: FieldType.dateIso, type: FieldType.date,
        filterable: true, filter: { model: Filters.compoundDate }
      },
      { id: 'finish', name: 'Finish', field: 'finish', nameKey: 'FINISH', formatter: Formatters.dateIso, outputType: FieldType.dateIso, type: FieldType.date, minWidth: 100, filterable: true, filter: { model: Filters.compoundDate } },
      {
        id: 'priority', nameKey: 'PRIORITY', field: 'priority',
        exportCustomFormatter: priorityExportFormatter,
        formatter: priorityFormatter,
        sortable: true, filterable: true,
        filter: {
          collection: [{ value: '', label: '' }, { value: 1, labelKey: 'LOW' }, { value: 2, labelKey: 'MEDIUM' }, { value: 3, labelKey: 'HIGH' }],
          model: Filters.singleSelect,
          enableTranslateLabel: true,
          filterOptions: {
            autoDropWidth: true
          }
        }
      },
      {
        id: 'completed', nameKey: 'COMPLETED', field: 'completed',
        exportCustomFormatter: Formatters.translateBoolean,
        formatter: Formatters.checkmark,
        sortable: true, filterable: true,
        filter: {
          collection: [{ value: '', label: '' }, { value: true, labelKey: 'TRUE' }, { value: false, labelKey: 'FALSE' }],
          model: Filters.singleSelect,
          enableTranslateLabel: true,
          filterOptions: {
            autoDropWidth: true
          }
        }
      },
      {
        id: 'action', name: 'Action', field: 'action', width: 110, maxWidth: 200,
        excludeFromExport: true,
        formatter: actionFormatter,
        cellMenu: {
          hideCloseButton: false,
          width: 200,
          // you can override the logic of when the menu is usable
          // for example say that we want to show a menu only when then Priority is set to 'High'.
          // Note that this ONLY overrides the usability itself NOT the text displayed in the cell,
          // if you wish to change the cell text (or hide it)
          // then you SHOULD use it in combination with a custom formatter (actionFormatter) and use the same logic in that formatter
          menuUsabilityOverride: (args) => {
            return (args.dataContext.priority === 3); // option 3 is High
          },

          // when using Translate Service, every translation will have the suffix "Key"
          // else use title without the suffix, for example "commandTitle" (no translations) or "commandTitleKey" (with translations)
          commandTitleKey: 'COMMANDS', // optional title, use "commandTitle" when not using I18N
          commandItems: [
            // array of command item objects, you can also use the "positionOrder" that will be used to sort the items in the list
            {
              command: 'command2', title: 'Command 2', positionOrder: 62,
              // you can use the "action" callback and/or use "onCallback" callback from the grid options, they both have the same arguments
              action: (_e, args) => {
                console.log(args.dataContext, args.column);
                // action callback.. do something
              },
              // only enable command when the task is not completed
              itemUsabilityOverride: (args) => {
                return !args.dataContext.completed;
              }
            },
            { command: 'command1', title: 'Command 1', cssClass: 'orange', positionOrder: 61 },
            {
              command: 'delete-row', titleKey: 'DELETE_ROW', positionOrder: 64,
              iconCssClass: 'fa fa-times', cssClass: 'red', textCssClass: 'bold',
              // only show command to 'Delete Row' when the task is not completed
              itemVisibilityOverride: (args) => {
                return !args.dataContext.completed;
              }
            },
            // you can pass divider as a string or an object with a boolean (if sorting by position, then use the object)
            // note you should use the "divider" string only when items array is already sorted and positionOrder are not specified
            { divider: true, command: '', positionOrder: 63 },
            // 'divider',

            {
              command: 'help',
              titleKey: 'HELP', // use "title" without translation and "titleKey" with TranslateService
              iconCssClass: 'fa fa-question-circle',
              positionOrder: 66,
            },
            { command: 'something', titleKey: 'DISABLED_COMMAND', disabled: true, positionOrder: 67, }
          ],
          optionTitleKey: 'CHANGE_COMPLETED_FLAG',
          optionItems: [
            { option: true, titleKey: 'TRUE', iconCssClass: 'fa fa-check-square-o' },
            { option: false, titleKey: 'FALSE', iconCssClass: 'fa fa-square-o' },
            {
              option: null, title: 'null', cssClass: 'italic',
              // you can use the "action" callback and/or use "onCallback" callback from the grid options, they both have the same arguments
              action: () => {
                // action callback.. do something
              },
              // only enable Action menu when the Priority is set to High
              itemUsabilityOverride: (args) => {
                return (args.dataContext.priority === 3);
              },
              // only show command to 'Delete Row' when the task is not completed
              itemVisibilityOverride: (args) => {
                return !args.dataContext.completed;
              }
            },
          ]
        }
      },
    ];

    this.gridOptions = {
      autoResize: {
        container: '#demo-container',
        rightPadding: 10
      },
      enableCellNavigation: true,
      enableFiltering: true,
      enableSorting: true,
      enableTranslate: true,
      enableExcelExport: true,
      excelExportOptions: {
        exportWithFormatter: true,
        customColumnWidth: 15,

        // you can customize how the header titles will be styled (defaults to Bold)
        columnHeaderStyle: { font: { bold: true, italic: true } }
      },
      registerExternalResources: [new ExcelExportService()],
      i18n: this.i18n,

      enableContextMenu: true,
      enableCellMenu: true,

      // when using the cellMenu, you can change some of the default options and all use some of the callback methods
      cellMenu: {
        // all the Cell Menu callback methods (except the action callback)
        // are available under the grid options as shown below
        onCommand: (_e, args) => this.executeCommand(_e, args),
        onOptionSelected: (_e, args) => {
          // change "Completed" property with new option selected from the Cell Menu
          const dataContext = args && args.dataContext;
          if (dataContext && dataContext.hasOwnProperty('completed')) {
            dataContext.completed = args.item.option;
            this.reactGrid.gridService.updateItem(dataContext);
          }
        },
        onBeforeMenuShow: ((_e, args) => {
          // for example, you could select the row that the click originated
          // this.reactGrid.gridService.setSelectedRows([args.row]);
          console.log('Before the Cell Menu is shown', args);
        }),
        onBeforeMenuClose: ((_e, args) => console.log('Cell Menu is closing', args)),
      },

      // load Context Menu structure
      contextMenu: this.getContextMenuOptions(),
    };
  }

  executeCommand(_e: Event, args: any) {
    const command = args.command;
    const dataContext = args.dataContext;

    switch (command) {
      case 'command1':
        alert('Command 1');
        break;
      case 'command2':
        alert('Command 2');
        break;
      case 'help':
        alert('Please help!');
        break;
      case 'delete-row':
        if (confirm(`Do you really want to delete row ${args.row + 1} with ${this.i18n.t('TASK_X', { x: dataContext.id })}`)) {
          this.reactGrid.dataView.deleteItem(dataContext.id);
        }
        break;
    }
  }

  getData(count: number): any[] {
    // mock a dataset
    const tmpData = [];
    for (let i = 0; i < count; i++) {
      const randomYear = 2000 + Math.floor(Math.random() * 30);
      const randomMonth = Math.floor(Math.random() * 11);
      const randomDay = Math.floor((Math.random() * 29));

      tmpData[i] = {
        id: i,
        duration: Math.floor(Math.random() * 25) + ' days',
        percentComplete: Math.floor(Math.random() * 100),
        start: new Date(randomYear, randomMonth, randomDay),
        finish: new Date(randomYear, (randomMonth + 1), randomDay),
        priority: i % 3 ? 2 : (i % 5 ? 3 : 1),
        completed: (i % 4 === 0),
      };
    }
    return tmpData;
  }

  getContextMenuOptions(): ContextMenu {
    return {
      hideCloseButton: false,
      width: 200,
      // optionally and conditionally define when the the menu is usable,
      // this should be used with a custom formatter to show/hide/disable the menu
      menuUsabilityOverride: (args) => {
        const dataContext = args && args.dataContext;
        return (dataContext.id < 21); // say we want to display the menu only from Task 0 to 20
      },
      // which column to show the command list? when not defined it will be shown over all columns
      commandShownOverColumnIds: ['id', 'title', 'percentComplete', 'start', 'finish', 'completed' /* , 'priority', 'action' */],
      commandTitleKey: 'COMMANDS', // this title is optional, you could also use "commandTitle" when not using I18N
      commandItems: [
        { divider: true, command: '', positionOrder: 61 },
        { command: 'delete-row', titleKey: 'DELETE_ROW', iconCssClass: 'fa fa-times', cssClass: 'red', textCssClass: 'bold', positionOrder: 62 },
        // you can pass divider as a string or an object with a boolean (if sorting by position, then use the object)
        // note you should use the "divider" string only when items array is already sorted and positionOrder are not specified
        // 'divider',
        { divider: true, command: '', positionOrder: 63 },
        {
          command: 'help', titleKey: 'HELP', iconCssClass: 'fa fa-question-circle', positionOrder: 64,
          // you can use the 'action' callback and/or subscribe to the 'onCallback' event, they both have the same arguments
          action: () => {
            // action callback.. do something
          },
          // only show command to 'Help' when the task is Not Completed
          itemVisibilityOverride: (args) => {
            const dataContext = args && args.dataContext;
            return (!dataContext.completed);
          }
        },
        { command: 'something', titleKey: 'DISABLED_COMMAND', disabled: true, positionOrder: 65 },
      ],

      // Options allows you to edit a column from an option chose a list
      // for example, changing the Priority value
      // you can also optionally define an array of column ids that you wish to display this option list (when not defined it will show over all columns)
      optionTitleKey: 'CHANGE_PRIORITY',
      optionShownOverColumnIds: ['priority'], // optional, when defined it will only show over the columns (column id) defined in the array
      optionItems: [
        {
          option: 0, title: 'n/a', textCssClass: 'italic',
          // only enable this option when the task is Not Completed
          itemUsabilityOverride: (args) => {
            const dataContext = args && args.dataContext;
            return (!dataContext.completed);
          },
          // you can use the 'action' callback and/or subscribe to the 'onCallback' event, they both have the same arguments
          action: () => {
            // action callback.. do something
          },
        },
        { option: 1, iconCssClass: 'fa fa-star-o yellow', titleKey: 'LOW' },
        { option: 2, iconCssClass: 'fa fa-star-half-o orange', titleKey: 'MEDIUM' },
        { option: 3, iconCssClass: 'fa fa-star red', titleKey: 'HIGH' },
        // you can pass divider as a string or an object with a boolean (if sorting by position, then use the object)
        // note you should use the "divider" string only when items array is already sorted and positionOrder are not specified
        'divider',
        // { divider: true, option: '', positionOrder: 3 },
        {
          option: 4, title: 'Extreme', iconCssClass: 'fa fa-fire', disabled: true,
          // only shown when the task is Not Completed
          itemVisibilityOverride: (args) => {
            const dataContext = args && args.dataContext;
            return (!dataContext.completed);
          }
        },
      ],
      // subscribe to Context Menu
      onBeforeMenuShow: ((_e, args) => {
        // for example, you could select the row it was clicked with
        // grid.setSelectedRows([args.row]); // select the entire row
        this.reactGrid.slickGrid.setActiveCell(args.row, args.cell, false); // select the cell that the click originated
        console.log('Before the global Context Menu is shown', args);
      }),
      onBeforeMenuClose: ((_e, args) => console.log('Global Context Menu is closing', args)),

      // subscribe to Context Menu onCommand event (or use the action callback on each command)
      onCommand: ((_e, args) => this.executeCommand(_e, args)),

      // subscribe to Context Menu onOptionSelected event (or use the action callback on each option)
      onOptionSelected: ((_e, args) => {
        // change Priority
        const dataContext = args && args.dataContext;
        if (dataContext && dataContext.hasOwnProperty('priority')) {
          dataContext.priority = args.item.option;
          this.reactGrid.gridService.updateItem(dataContext);
        }
      }),
    };
  }

  showContextCommandsAndOptions(showBothList: boolean) {
    // when showing both Commands/Options, we can just pass an empty array to show over all columns
    // else show on all columns except Priority
    const showOverColumnIds = showBothList ? [] : ['id', 'title', 'complete', 'start', 'finish', 'completed', 'action'];
    this.contextMenuInstance.setOptions({
      commandShownOverColumnIds: showOverColumnIds,
      // hideCommandSection: !showBothList
    });
  }

  showCellMenuCommandsAndOptions(showBothList: boolean) {
    // change via the plugin setOptions
    this.cellMenuInstance.setOptions({
      hideOptionSection: !showBothList
    });

    // OR find the column, then change the same hide property
    // var actionColumn = columns.find(function (column) { return column.id === 'action' });
    // actionColumn.cellMenu.hideOptionSection = !showBothList;
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
              href="https://github.com/ghiscoding/slickgrid-react/blob/master/src/examples/slickgrid/example24.ts">
              <span className="fa fa-link"></span> code
            </a>
          </span>
        </h2>
        <div className="subtitle">{this.subTitle}</div>

        <div className="row">
          <span className="context-menu">
            <strong>Context Menu:</strong>
            <button className="btn btn-outline-secondary btn-xs" onClick={() => this.showContextCommandsAndOptions(false)}
              data-test="context-menu-priority-only-button">
              Show Priority Options Only
            </button>
            <button className="btn btn-outline-secondary btn-xs" onClick={() => this.showContextCommandsAndOptions(true)}
              data-test="context-menu-commands-and-priority-button">
              Show Commands & Priority Options
            </button>
          </span>

          <span className="cell-menu">
            <strong>Cell Menu:</strong>
            <button className="btn btn-outline-secondary btn-xs" onClick={() => this.showCellMenuCommandsAndOptions(false)}
              data-test="cell-menu-commands-and-options-false-button">
              Show Action Commands Only
            </button>
            <button className="btn btn-outline-secondary btn-xs" onClick={() => this.showCellMenuCommandsAndOptions(true)}
              data-test="cell-menu-commands-and-options-true-button">
              Show Actions Commands & Completed Options
            </button>
          </span>
        </div>

        <div className="row locale">
          <div className="col-12">
            <button className="btn btn-outline-secondary btn-xs" onClick={this.switchLanguage} data-test="language-button">
              <i className="fa fa-language"></i>
              Switch Language
            </button>
            <label>Locale:</label>
            <span style={{ fontStyle: 'italic' }} data-test="selected-locale">
              {this.selectedLanguage + '.json'}
            </span>
          </div>
        </div>

        <ReactSlickgridCustomElement gridId="grid24"
          columnDefinitions={this.columnDefinitions}
          gridOptions={this.gridOptions}
          dataset={this.dataset}
          instances={this.reactGrid} />
      </div>
    );
  }
}
