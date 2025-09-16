import React, { useMemo } from 'react';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-material.css';
import {
  Box,
  IconButton,
  Chip,
  Avatar,
  useTheme,
  alpha,
  Typography,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  AccountBalance as AccountBalanceIcon,
  CreditCard as CreditCardIcon,
  Savings as SavingsIcon,
  TrendingUp as TrendingUpIcon,
  School as SchoolIcon,
  Home as HomeIcon,
  Receipt as ReceiptIcon,
  PersonalVideo as PersonalVideoIcon,
  DirectionsCar as CarIcon,
} from '@mui/icons-material';

const DataTable = ({ 
  data, 
  type = 'items', // 'accounts' or 'debts' or default to 'items'
  onEdit, 
  onDelete,
  loading = false,
  // Additional props for compatibility
  columns,
  rows,
  height
}) => {
  const theme = useTheme();
  
  // Use data prop if provided, otherwise use rows prop for compatibility
  const tableData = data || rows || [];
  
  const accountTypes = {
    checking: { label: 'Checking', icon: <AccountBalanceIcon />, color: '#1976d2' },
    savings: { label: 'Savings', icon: <SavingsIcon />, color: '#2e7d32' },
    investment: { label: 'Investment', icon: <TrendingUpIcon />, color: '#7b1fa2' },
    other: { label: 'Other', icon: <ReceiptIcon />, color: '#ed6c02' }
  };

  const debtTypes = {
    'credit-card': { label: 'Credit Card', icon: <CreditCardIcon />, color: '#d32f2f' },
    'personal-loan': { label: 'Personal Loan', icon: <PersonalVideoIcon />, color: '#f57c00' },
    'student-loan': { label: 'Student Loan', icon: <SchoolIcon />, color: '#1976d2' },
    'auto-loan': { label: 'Auto Loan', icon: <CarIcon />, color: '#388e3c' },
    'mortgage': { label: 'Mortgage', icon: <HomeIcon />, color: '#7b1fa2' },
    'other': { label: 'Other', icon: <ReceiptIcon />, color: '#616161' }
  };

  const getTypeInfo = (typeValue) => {
    const types = type === 'accounts' ? accountTypes : debtTypes;
    return types[typeValue] || types.other;
  };

  // Cell renderers
  const TypeCellRenderer = ({ value }) => {
    const typeInfo = getTypeInfo(value);
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Avatar sx={{ 
          width: 24, 
          height: 24, 
          bgcolor: alpha(typeInfo.color, 0.1),
          color: typeInfo.color
        }}>
          {React.cloneElement(typeInfo.icon, { sx: { fontSize: 16 } })}
        </Avatar>
        <Chip 
          label={typeInfo.label}
          size="small"
          sx={{ 
            bgcolor: alpha(typeInfo.color, 0.1),
            color: typeInfo.color
          }}
        />
      </Box>
    );
  };

  const BalanceCellRenderer = ({ value }) => {
    const color = type === 'accounts' ? '#2e7d32' : '#d32f2f';
    
    return (
      <Typography
        variant="body2"
        sx={{
          fontWeight: 'bold',
          color: color,
        }}
      >
        ${value.toLocaleString()}
      </Typography>
    );
  };

  const InterestRateCellRenderer = ({ value }) => (
    <Typography variant="body2">
      {value}%
    </Typography>
  );

  const ActionsCellRenderer = ({ data }) => (
    <Box sx={{ display: 'flex', gap: 1 }}>
      <IconButton
        size="small"
        onClick={() => onEdit && onEdit(data)}
        sx={{ 
          '&:hover': { 
            bgcolor: alpha(theme.palette.primary.main, 0.1) 
          }
        }}
      >
        <EditIcon fontSize="small" />
      </IconButton>
      <IconButton
        size="small"
        onClick={() => onDelete && onDelete(data)}
        sx={{ 
          '&:hover': { 
            bgcolor: alpha(theme.palette.error.main, 0.1) 
          }
        }}
      >
        <DeleteIcon fontSize="small" />
      </IconButton>
    </Box>
  );

  const columnDefs = useMemo(() => {
    // Use passed columns if provided, otherwise use internal column definitions
    if (columns && columns.length > 0) {
      return columns;
    }
    
    const baseColumns = [
      {
        headerName: 'Name',
        field: 'name',
        sortable: true,
        filter: true,
        resizable: true,
        flex: 2,
        cellStyle: { fontWeight: 'bold' }
      },
      {
        headerName: 'Type',
        field: type === 'accounts' ? 'account_type' : 'debt_type',
        sortable: true,
        filter: true,
        resizable: true,
        flex: 1,
        cellRenderer: TypeCellRenderer
      },
      {
        headerName: 'Balance',
        field: 'balance',
        sortable: true,
        filter: 'agNumberColumnFilter',
        resizable: true,
        flex: 1,
        cellRenderer: BalanceCellRenderer,
        comparator: (a, b) => a - b
      },
      {
        headerName: 'Interest Rate',
        field: 'interest_rate',
        sortable: true,
        filter: 'agNumberColumnFilter',
        resizable: true,
        flex: 1,
        cellRenderer: InterestRateCellRenderer
      },
      {
        headerName: 'Effective Date',
        field: 'effective_date',
        sortable: true,
        filter: 'agDateColumnFilter',
        resizable: true,
        flex: 1,
        valueFormatter: (params) => {
          if (!params.value) return '';
          return new Date(params.value).toLocaleDateString();
        }
      }
    ];

    // Add Actions column only if handlers are provided
    if (onEdit || onDelete) {
      baseColumns.push({
        headerName: 'Actions',
        field: 'actions',
        cellRenderer: ActionsCellRenderer,
        sortable: false,
        filter: false,
        resizable: false,
        width: 100,
        pinned: 'right'
      });
    }

    return baseColumns;
  }, [type, ActionsCellRenderer, BalanceCellRenderer, TypeCellRenderer, columns, onEdit, onDelete]);

  const defaultColDef = useMemo(() => ({
    sortable: true,
    filter: true,
    resizable: true,
    minWidth: 100,
  }), []);

  // Define our unified dark theme colors
  const debtDarkColors = {
    card: '#1a1a1a',
    border: '#333333',
    blue: '#2196f3',
    red: '#f44336',
    lightGrey: '#e0e0e0'
  };

  const gridTheme = theme.palette.mode === 'dark' ? 'ag-theme-material-dark' : 'ag-theme-material';

  return (
    <Box 
      className={gridTheme}
      sx={{
        height: height || 400,
        width: '100%',
        '& .ag-theme-material': {
          '--ag-background-color': '#f5f5f5',
          '--ag-header-background-color': '#e3f2fd',
          '--ag-odd-row-background-color': '#fafafa',
          '--ag-row-hover-color': '#e8f5e8',
          '--ag-selected-row-background-color': '#e3f2fd',
          '--ag-border-color': '#1976d2',
          '--ag-header-foreground-color': '#1976d2',
          '--ag-foreground-color': '#2c3e50',
          '--ag-secondary-foreground-color': '#666666',
        },
        '& .ag-theme-material-dark': {
          '--ag-background-color': '#0a0a0a',
          '--ag-header-background-color': debtDarkColors.blue,
          '--ag-odd-row-background-color': '#1a1a1a',
          '--ag-row-hover-color': '#333333',
          '--ag-selected-row-background-color': '#404040',
          '--ag-border-color': debtDarkColors.border,
          '--ag-header-foreground-color': 'white',
          '--ag-foreground-color': debtDarkColors.lightGrey,
          '--ag-secondary-foreground-color': '#b0b0b0',
        }
      }}
    >
      <AgGridReact
        rowData={tableData}
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        animateRows={true}
        rowSelection="single"
        suppressRowClickSelection={true}
        rowHeight={60}
        headerHeight={48}
        loading={loading}
        noRowsOverlayComponent={() => (
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center',
            height: '100%',
            color: 'text.secondary' 
          }}>
            <Typography variant="h6" gutterBottom>
              No {type || 'items'} found
            </Typography>
            <Typography variant="body2">
              Add your first {(type || 'item').slice(0, -1)} to get started
            </Typography>
          </Box>
        )}
        overlayLoadingTemplate="<span>Loading...</span>"
        pagination={true}
        paginationPageSize={20}
        paginationAutoPageSize={false}
        suppressPaginationPanel={false}
        domLayout="normal"
      />
    </Box>
  );
};

export default DataTable;
