import { GraphqlService, GraphqlResult, GraphqlServiceApi, } from '@slickgrid-universal/graphql';
import {
  ReactGridInstance,
  Column,
  Filters,
  Formatters,
  GridOption,
  Metrics,
  MultipleSelectOption,
  OperatorType,
  ReactSlickgridCustomElement
} from '../../slickgrid-react';
import React from 'react';
import './example25.scss'; // provide custom CSS/SASS styling

const COUNTRIES_API = 'https://countries.trevorblades.com/';

export interface Country {
  countryCode: string;
  countryName: string;
  countryNative: string;
  countryPhone: number;
  countryCurrency: string;
  countryEmoji: string;
  continentCode: string;
  continentName: string;
  languageCode: string;
  languageName: string;
  languageNative: string;
}

interface Props { }

export default class Example25 extends React.Component {
  title = 'Example 25: GraphQL Basic API without Pagination';
  subTitle = `
  Use basic GraphQL query with any external public APIs (<a href="https://github.com/ghiscoding/slickgrid-react/wiki/GraphQL" target="_blank">Wiki docs</a>).
  <ul>
    <li>This Examples uses a Public GraphQL API that you can find at this link <a href="https://countries.trevorblades.com/" target="_blank">https://countries.trevorblades.com/</a></li>
    <li>Compare to the regular and default GraphQL implementation, you will find the following differences</li>
    <ul>
      <li>There are no Pagination and we only use GraphQL <b>once</b> to load the data, then we use the grid as a regular local in-memory grid</li>
      <li>We enabled the following 2 flags "useLocalFiltering" and "useLocalSorting" to use regular (in memory) DataView filtering/sorting</li>
    </ul>
    <li>NOTE - This Example calls multiple GraphQL queries, this is <b>ONLY</b> for demo purposes, you would typically only call 1 query (which is what GraphQL is good at)</li>
    <li>This example is mainly to demo the use of GraphqlService to build the query and retrieve the data but also to demo how to mix that with local (in-memory) Filtering/Sorting strategies</li>
  </ul>
  `;

  reactGrid!: ReactGridInstance;
  columnDefinitions: Column[] = [];
  gridOptions!: GridOption;
  dataset = [];
  metrics!: Metrics;

  isWithCursor = false;
  graphqlQuery = '';
  processing = false;
  selectedLanguage = '';
  status = { text: '', class: '' };

  constructor(public readonly props: Props) {
    super(props);
    // define the grid options & columns and then create the grid itself
    this.defineGrid();
  }

  defineGrid() {
    this.columnDefinitions = [
      { id: 'countryCode', field: 'code', name: 'Code', maxWidth: 90, sortable: true, filterable: true, columnGroup: 'Country' },
      { id: 'countryName', field: 'name', name: 'Name', width: 60, sortable: true, filterable: true, columnGroup: 'Country' },
      { id: 'countryNative', field: 'native', name: 'Native', width: 60, sortable: true, filterable: true, columnGroup: 'Country' },
      { id: 'countryPhone', field: 'phone', name: 'Phone Area Code', maxWidth: 110, sortable: true, filterable: true, columnGroup: 'Country' },
      { id: 'countryCurrency', field: 'currency', name: 'Currency', maxWidth: 90, sortable: true, filterable: true, columnGroup: 'Country' },
      { id: 'countryEmoji', field: 'emoji', name: 'Emoji', maxWidth: 90, sortable: true, columnGroup: 'Country' },
      {
        id: 'languageName', field: 'languages.name', name: 'Names', width: 60,
        formatter: Formatters.arrayObjectToCsv, columnGroup: 'Language',
        params: { propertyNames: ['name'], useFormatterOuputToFilter: true },
        filterable: true,
        // this Filter is a bit more tricky than others since the values are an array of objects
        // what we can do is use the Formatter to search from the CSV string coming from the Formatter (with "useFormatterOuputToFilter: true")
        // we also need to use the Operator IN_CONTAINS
        filter: {
          model: Filters.multipleSelect,
          collectionAsync: this.getLanguages(),
          operator: OperatorType.inContains,
          collectionOptions: {
            addBlankEntry: true,
            // the data is not at the root of the array, so we must tell the Select Filter where to pull the data
            collectionInsideObjectProperty: 'data.languages'
          },
          collectionFilterBy: [
            // filter out any empty values
            { property: 'name', value: '', operator: 'NE' },
            { property: 'name', value: null, operator: 'NE' },
          ],
          collectionSortBy: {
            property: 'name'
          },
          customStructure: {
            value: 'name',
            label: 'name',
          },
          filterOptions: {
            filter: true
          } as MultipleSelectOption
        },
      },
      {
        id: 'languageNative', field: 'languages.native', name: 'Native', width: 60,
        formatter: Formatters.arrayObjectToCsv, params: { propertyNames: ['native'], useFormatterOuputToFilter: true }, columnGroup: 'Language',
        filterable: true,
        filter: {
          model: Filters.multipleSelect,
          collectionAsync: this.getLanguages(),
          operator: OperatorType.inContains,
          collectionOptions: {
            addBlankEntry: true,
            // the data is not at the root of the array, so we must tell the Select Filter where to pull the data
            collectionInsideObjectProperty: 'data.languages'
          },
          collectionFilterBy: [
            // filter out any empty values
            { property: 'native', value: '', operator: 'NE' },
            { property: 'native', value: null, operator: 'NE' },
          ],
          collectionSortBy: {
            property: 'native'
          },
          customStructure: {
            value: 'native',
            label: 'native',
          },
          filterOptions: {
            filter: true
          } as MultipleSelectOption
        },
      },
      {
        id: 'languageCode', field: 'languages.code', name: 'Codes', maxWidth: 100,
        formatter: Formatters.arrayObjectToCsv, params: { propertyNames: ['code'], useFormatterOuputToFilter: true }, columnGroup: 'Language',
        filterable: true,
      },
      {
        id: 'continentName', field: 'continent.name', name: 'Name', width: 60, sortable: true,
        filterable: true, formatter: Formatters.complexObject, columnGroup: 'Continent'
      },
      {
        id: 'continentCode', field: 'continent.code', name: 'Code', maxWidth: 90,
        sortable: true,
        filterable: true,
        filter: {
          model: Filters.singleSelect,
          collectionAsync: this.getContinents(),
          collectionOptions: {
            // the data is not at the root of the array, so we must tell the Select Filter where to pull the data
            collectionInsideObjectProperty: 'data.continents',
            addBlankEntry: true,
            separatorBetweenTextLabels: ': ',
          },
          customStructure: {
            value: 'code',
            label: 'code',
            labelSuffix: 'name',
          }
        },
        formatter: Formatters.complexObject, columnGroup: 'Continent',
      },
    ];

    this.gridOptions = {
      autoResize: {
        container: '#demo-container',
        rightPadding: 10
      },
      enableFiltering: true,
      enableCellNavigation: true,
      enablePagination: false,
      enableTranslate: true,
      createPreHeaderPanel: true,
      showPreHeaderPanel: true,
      preHeaderPanelHeight: 28,
      datasetIdPropertyName: 'code',
      showCustomFooter: true, // display some metrics in the bottom custom footer
      backendServiceApi: {
        // use the GraphQL Service to build the query but use local (in memory) Filtering/Sorting strategies
        // the useLocalFiltering/useLocalSorting flags can be enabled independently
        service: new GraphqlService(),
        useLocalFiltering: true,
        useLocalSorting: true,

        options: {
          datasetName: 'countries', // the only REQUIRED property
        },
        // you can define the onInit callback OR enable the "executeProcessCommandOnInit" flag in the service init
        preProcess: () => this.displaySpinner(true),
        process: (query) => this.getCountries(query),
        postProcess: (result: GraphqlResult<Country>) => {
          this.metrics = result.metrics as Metrics;
          this.displaySpinner(false);
        }
      } as GraphqlServiceApi
    };
  }

  displaySpinner(isProcessing: boolean) {
    this.processing = isProcessing;
    this.status = (isProcessing)
      ? { text: 'processing...', class: 'alert alert-danger' }
      : { text: 'done', class: 'alert alert-success' };
  }

  // --
  // NOTE - Demo Code ONLY
  // This Example calls multiple GraphQL queries, this is ONLY for demo purposes, you would typically only call 1 query (which is what GraphQL is good at)
  // This demo is mainly to show the use of GraphqlService to build the query and retrieve the data but also to show how to mix that with usage of local Filtering/Sorting strategies
  // --

  /** Calling the GraphQL backend API to get the Countries with the Query created by the "process" method of GraphqlService  */
  getCountries(query: string): Promise<GraphqlResult<Country>> {
    return new Promise(async resolve => {
      const response = await fetch(COUNTRIES_API, {
        method: 'post',
        body: json({ query })
      });
      resolve(response.json());
    });
  }

  /**
   * Calling again the GraphQL backend API, however in this case we cannot use the GraphQL Service to build the query
   * So we will have to write, by hand, the query to get the continents code & name
   * We also need to resolve the data in a flat array (singleSelect/multipleSelect Filters only accept data at the root of the array)
   */
  getContinents(): Promise<GraphqlResult<{ code: string; name: string; }>> {
    const continentQuery = `query { continents { code, name  }}`;
    return new Promise(async resolve => {
      const response = await fetch(COUNTRIES_API, {
        method: 'post',
        body: json({ query: continentQuery })
      });
      resolve(response.json());
    });
  }

  /**
   * Calling again the GraphQL backend API, however in this case we cannot use the GraphQL Service to build the query
   * So we will have to write, by hand, the query to get the languages code & name
   * We also need to resolve the data in a flat array (singleSelect/multipleSelect Filters only accept data at the root of the array)
   */
  getLanguages(): Promise<GraphqlResult<{ code: string; name: string; native: string; }>> {
    const languageQuery = `query { languages { code, name, native  }}`;
    return new Promise(async resolve => {
      const response = await fetch(COUNTRIES_API, {
        method: 'post',
        body: json({ query: languageQuery })
      });
      resolve(response.json());
    });
  }

  setFiltersDynamically() {
    // we can Set Filters Dynamically (or different filters) afterward through the FilterService
    this.reactGrid.filterService.updateFilters([
      { columnId: 'countryName', searchTerms: ['G'], operator: OperatorType.startsWith },
    ]);
  }

  setSortingDynamically() {
    this.reactGrid.sortService.updateSorting([
      // orders matter, whichever is first in array will be the first sorted column
      { columnId: 'billingAddressZip', direction: 'DESC' },
      { columnId: 'company', direction: 'ASC' },
    ]);
  }

  render() {
    return (
      <div id="demo-container" className="container-fluid">
        <h2>
          {this.title}
          <span className="float-right">
            <a style={{ fontSize: '18px' }}
              target="_blank"
              href="https://github.com/ghiscoding/slickgrid-react/blob/master/src/examples/slickgrid/example25.ts">
              <span className="fa fa-link"></span> code
            </a>
          </span>
        </h2>
        <div className="subtitle">{this.subTitle}</div>

        <div className="row">
          <div className="col-xs-6 col-sm-3">
            <div className={this.status.class} role="alert" data-test="status">
              <strong>Status: </strong> {this.status.text}
              {!this.processing && <span>
                <i className="fa fa-refresh fa-spin fa-lg fa-fw"></i>
              </span>}
            </div>
          </div>
        </div>

        <ReactSlickgridCustomElement gridId="grid25"
          columnDefinitions={this.columnDefinitions}
          gridOptions={this.gridOptions}
          dataset={this.dataset} />
      </div>
    );
  }
}
