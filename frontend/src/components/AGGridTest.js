import React from 'react';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';

ModuleRegistry.registerModules([AllCommunityModule]);

const AGGridTest = () => {
  console.log('AGGridTest component mounting...');

  const columnDefs = [
    { headerName: 'Name', field: 'name' },
    { headerName: 'Age', field: 'age' },
    { headerName: 'City', field: 'city' }
  ];

  const rowData = [
    { name: 'John', age: 30, city: 'New York' },
    { name: 'Jane', age: 25, city: 'Los Angeles' },
    { name: 'Bob', age: 35, city: 'Chicago' }
  ];

  console.log('AGGridTest - columnDefs:', columnDefs);
  console.log('AGGridTest - rowData:', rowData);

  return (
    <div style={{ padding: '2rem' }}>
      <h2>AG Grid Test Component</h2>
      <div style={{padding: '1rem', background: 'yellow', margin: '1rem 0'}}>
        AG Grid should appear below this yellow box
      </div>
      <div className="ag-theme-alpine" style={{ width: '100%', height: 300, border: '2px solid red' }}>
        <AgGridReact
          rowData={rowData}
          columnDefs={columnDefs}
          defaultColDef={{ resizable: true }}
        />
      </div>
      <div style={{padding: '1rem', background: 'lightgreen', margin: '1rem 0'}}>
        If you see this green box but no table, AG Grid failed to render
      </div>
    </div>
  );
};

export default AGGridTest; 