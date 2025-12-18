import React, { useState, useEffect } from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  Box,
  Typography,
  Avatar,
  Divider,
  IconButton,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Settings as SettingsIcon,
  Assessment as AssessmentIcon,
  BarChart as BarChartIcon,
  Folder as FolderIcon,
  ExpandLess,
  ExpandMore,
  Description as DescriptionIcon,
  Email as EmailIcon,
  FolderOpen as FolderOpenIcon,
  Palette as PaletteIcon,
  Cloud as CloudIcon,
  SmartToy as SmartToyIcon,
  TrendingUp as TrendingUpIcon,
  Receipt as ReceiptIcon,
  BusinessCenter as BusinessCenterIcon,
  Business as BusinessIcon,
  People as PeopleIcon,
  LocalShipping as LocalShippingIcon,
  ChevronLeft as ChevronLeftIcon,
  CloudDownload as CloudDownloadIcon,
  HelpOutline as HelpOutlineIcon,
  Tune as TuneIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useAppConfig } from '../contexts/AppConfigContext';

const DRAWER_WIDTH = 260;

interface MenuItem {
  id: number;
  menu_key: string;
  menu_label: string;
  menu_icon: string;
  menu_path: string | null;
  parent_id: number | null;
  display_order: number;
  required_role: string | null;
  is_active: boolean;
  children?: MenuItem[];
}

const iconMap: { [key: string]: React.ReactElement } = {
  DashboardIcon: <DashboardIcon />,
  SettingsIcon: <SettingsIcon />,
  AssessmentIcon: <AssessmentIcon />,
  BarChartIcon: <BarChartIcon />,
  FolderIcon: <FolderIcon />,
  DescriptionIcon: <DescriptionIcon />,
  EmailIcon: <EmailIcon />,
  FolderOpenIcon: <FolderOpenIcon />,
  PaletteIcon: <PaletteIcon />,
  CloudIcon: <CloudIcon />,
  SmartToyIcon: <SmartToyIcon />,
  TrendingUpIcon: <TrendingUpIcon />,
  ReceiptIcon: <ReceiptIcon />,
  BusinessCenterIcon: <BusinessCenterIcon />,
  BusinessIcon: <BusinessIcon />,
  PeopleIcon: <PeopleIcon />,
  LocalShippingIcon: <LocalShippingIcon />,
  CloudDownloadIcon: <CloudDownloadIcon />,
  HelpOutlineIcon: <HelpOutlineIcon />,
  TuneIcon: <TuneIcon />,
};

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ open, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { companyName, version, footerText } = useAppConfig();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [openMenus, setOpenMenus] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    fetchMenuItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchMenuItems = async () => {
    try {
      // Por ahora usamos datos locales basados en la base de datos
      // Más adelante esto se obtendrá del backend con filtrado por rol
      console.log('[Sidebar] Usuario actual:', user);
      const allMenuItems: MenuItem[] = [
        {
          id: 1,
          menu_key: 'dashboard',
          menu_label: 'Dashboard',
          menu_icon: 'DashboardIcon',
          menu_path: '/dashboard',
          parent_id: null,
          display_order: 1,
          required_role: 'consulta',
          is_active: true,
        },
        {
          id: 18,
          menu_key: 'cfdis',
          menu_label: 'CFDIs',
          menu_icon: 'DescriptionIcon',
          menu_path: '/cfdis',
          parent_id: null,
          display_order: 2,
          required_role: 'consulta',
          is_active: true,
        },
        {
          id: 19,
          menu_key: 'reportes_general',
          menu_label: 'Reportes',
          menu_icon: 'AssessmentIcon',
          menu_path: '/reportes',
          parent_id: null,
          display_order: 3,
          required_role: 'analista',
          is_active: true,
        },
        {
          id: 20,
          menu_key: 'kpis_general',
          menu_label: 'KPIs',
          menu_icon: 'TrendingUpIcon',
          menu_path: '/kpis',
          parent_id: null,
          display_order: 4,
          required_role: 'consulta',
          is_active: true,
        },
        {
          id: 21,
          menu_key: 'graficas',
          menu_label: 'Gráficas',
          menu_icon: 'BarChartIcon',
          menu_path: '/charts',
          parent_id: null,
          display_order: 5,
          required_role: 'consulta',
          is_active: true,
        },
        {
          id: 22,
          menu_key: 'descarga_masiva_sat',
          menu_label: 'Descarga Masiva SAT',
          menu_icon: 'CloudDownloadIcon',
          menu_path: '/descarga-masiva-sat',
          parent_id: null,
          display_order: 6,
          required_role: 'admin',
          is_active: true,
        },
        {
          id: 25,
          menu_key: 'mcp_agent',
          menu_label: 'MCP Agent',
          menu_icon: 'SmartToyIcon',
          menu_path: '/mcp-agent',
          parent_id: null,
          display_order: 7,
          required_role: 'consulta',
          is_active: true,
        },
        {
          id: 26,
          menu_key: 'usuarios',
          menu_label: 'Usuarios',
          menu_icon: 'PeopleIcon',
          menu_path: '/usuarios',
          parent_id: null,
          display_order: 8,
          required_role: 'admin',
          is_active: true,
        },
        {
          id: 2,
          menu_key: 'configuracion',
          menu_label: 'Configuración',
          menu_icon: 'SettingsIcon',
          menu_path: null,
          parent_id: null,
          display_order: 9,
          required_role: 'admin',
          is_active: true,
        },
        {
          id: 27,
          menu_key: 'config_general',
          menu_label: 'Configuración General',
          menu_icon: 'TuneIcon',
          menu_path: '/configuracion/general',
          parent_id: 2,
          display_order: 0,
          required_role: 'admin',
          is_active: true,
        },
        {
          id: 6,
          menu_key: 'config_constancia',
          menu_label: 'Constancia Fiscal',
          menu_icon: 'DescriptionIcon',
          menu_path: '/configuracion/constancia',
          parent_id: 2,
          display_order: 1,
          required_role: 'admin',
          is_active: true,
        },
        {
          id: 7,
          menu_key: 'config_email',
          menu_label: 'Correo Electrónico',
          menu_icon: 'EmailIcon',
          menu_path: '/configuracion/email',
          parent_id: 2,
          display_order: 2,
          required_role: 'admin',
          is_active: true,
        },
        {
          id: 8,
          menu_key: 'config_folders',
          menu_label: 'Carpetas',
          menu_icon: 'FolderOpenIcon',
          menu_path: '/configuracion/folders',
          parent_id: 2,
          display_order: 3,
          required_role: 'admin',
          is_active: true,
        },
        {
          id: 9,
          menu_key: 'config_templates',
          menu_label: 'Plantillas y Temas',
          menu_icon: 'PaletteIcon',
          menu_path: '/configuracion/templates',
          parent_id: 2,
          display_order: 4,
          required_role: 'admin',
          is_active: true,
        },
        {
          id: 10,
          menu_key: 'config_mcp',
          menu_label: 'Conexión MCP',
          menu_icon: 'CloudIcon',
          menu_path: '/configuracion/mcp',
          parent_id: 2,
          display_order: 5,
          required_role: 'admin',
          is_active: true,
        },
        {
          id: 11,
          menu_key: 'config_ai',
          menu_label: 'Configuración IA',
          menu_icon: 'SmartToyIcon',
          menu_path: '/configuracion/ai',
          parent_id: 2,
          display_order: 6,
          required_role: 'admin',
          is_active: true,
        },
        {
          id: 24,
          menu_key: 'config_fiel',
          menu_label: 'e.firma (FIEL) SAT',
          menu_icon: 'ReceiptIcon',
          menu_path: '/configuracion/fiel',
          parent_id: 2,
          display_order: 7,
          required_role: 'admin',
          is_active: true,
        },
        {
          id: 3,
          menu_key: 'reportes',
          menu_label: 'Reportes Avanzados',
          menu_icon: 'AssessmentIcon',
          menu_path: null,
          parent_id: null,
          display_order: 10,
          required_role: 'analista',
          is_active: true,
        },
        {
          id: 5,
          menu_key: 'catalogos',
          menu_label: 'Catálogos',
          menu_icon: 'FolderIcon',
          menu_path: null,
          parent_id: null,
          display_order: 11,
          required_role: 'contador',
          is_active: true,
        },
        {
          id: 23,
          menu_key: 'ayuda',
          menu_label: 'Ayuda',
          menu_icon: 'HelpOutlineIcon',
          menu_path: '/ayuda',
          parent_id: null,
          display_order: 99,
          required_role: 'consulta',
          is_active: true,
        },
        {
          id: 12,
          menu_key: 'reportes_kpi',
          menu_label: 'KPIs',
          menu_icon: 'TrendingUpIcon',
          menu_path: '/reportes/kpi',
          parent_id: 3,
          display_order: 1,
          required_role: 'analista',
          is_active: true,
        },
        {
          id: 13,
          menu_key: 'reportes_fiscal',
          menu_label: 'Reportes Fiscales',
          menu_icon: 'ReceiptIcon',
          menu_path: '/reportes/fiscal',
          parent_id: 3,
          display_order: 2,
          required_role: 'contador',
          is_active: true,
        },
        {
          id: 14,
          menu_key: 'reportes_ejecutivo',
          menu_label: 'Reportes Ejecutivos',
          menu_icon: 'BusinessCenterIcon',
          menu_path: '/reportes/ejecutivo',
          parent_id: 3,
          display_order: 3,
          required_role: 'admin',
          is_active: true,
        },
        {
          id: 28,
          menu_key: 'reportes_conciliacion',
          menu_label: 'Conciliación',
          menu_icon: 'AssessmentIcon',
          menu_path: '/reportes/conciliacion',
          parent_id: 3,
          display_order: 4,
          required_role: 'contador',
          is_active: true,
        },
        {
          id: 15,
          menu_key: 'catalogos_clientes',
          menu_label: 'Clientes',
          menu_icon: 'BusinessIcon',
          menu_path: '/catalogos/clientes',
          parent_id: 5,
          display_order: 1,
          required_role: 'contador',
          is_active: true,
        },
        {
          id: 16,
          menu_key: 'catalogos_usuarios',
          menu_label: 'Usuarios',
          menu_icon: 'PeopleIcon',
          menu_path: '/catalogos/usuarios',
          parent_id: 5,
          display_order: 2,
          required_role: 'admin',
          is_active: true,
        },
        {
          id: 17,
          menu_key: 'catalogos_proveedores',
          menu_label: 'Proveedores',
          menu_icon: 'LocalShippingIcon',
          menu_path: '/catalogos/proveedores',
          parent_id: 5,
          display_order: 3,
          required_role: 'contador',
          is_active: true,
        },
      ];

      // Filtrar por rol del usuario
      const filteredItems = filterMenuByRole(allMenuItems, user?.role || 'consulta');
      console.log('[Sidebar] Items filtrados:', filteredItems.length, filteredItems.map(i => ({id: i.id, label: i.menu_label, display_order: i.display_order})));

      // Construir árbol de menú
      const menuTree = buildMenuTree(filteredItems);
      console.log('[Sidebar] Árbol de menú:', menuTree.length, menuTree.map(i => ({id: i.id, label: i.menu_label})));
      setMenuItems(menuTree);
    } catch (error) {
      console.error('Error fetching menu items:', error);
    }
  };

  const roleHierarchy: { [key: string]: number } = {
    consulta: 1,
    analista: 2,
    contador: 3,
    admin: 4,
    superadmin: 5,
  };

  const filterMenuByRole = (items: MenuItem[], userRole: string): MenuItem[] => {
    const userRoleLevel = roleHierarchy[userRole] || 1;

    return items.filter((item) => {
      if (!item.required_role) return true;
      const requiredLevel = roleHierarchy[item.required_role] || 1;
      return userRoleLevel >= requiredLevel;
    });
  };

  const buildMenuTree = (items: MenuItem[]): MenuItem[] => {
    const itemMap: { [key: number]: MenuItem } = {};
    const rootItems: MenuItem[] = [];

    // Crear mapa de items
    items.forEach((item) => {
      itemMap[item.id] = { ...item, children: [] };
    });

    // Construir árbol
    items.forEach((item) => {
      if (item.parent_id === null) {
        rootItems.push(itemMap[item.id]);
      } else if (itemMap[item.parent_id]) {
        itemMap[item.parent_id].children!.push(itemMap[item.id]);
      }
    });

    // Ordenar por display_order
    rootItems.sort((a, b) => a.display_order - b.display_order);
    rootItems.forEach((item) => {
      if (item.children) {
        item.children.sort((a, b) => a.display_order - b.display_order);
      }
    });

    return rootItems;
  };

  const handleMenuClick = (item: MenuItem) => {
    if (item.menu_path) {
      navigate(item.menu_path);
      if (window.innerWidth < 960) {
        onClose();
      }
    } else if (item.children && item.children.length > 0) {
      setOpenMenus((prev) => ({
        ...prev,
        [item.menu_key]: !prev[item.menu_key],
      }));
    }
  };

  const isActive = (path: string | null) => {
    if (!path) return false;
    return location.pathname === path;
  };

  const renderMenuItem = (item: MenuItem, level: number = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isOpen = openMenus[item.menu_key];
    const active = isActive(item.menu_path);

    return (
      <React.Fragment key={item.menu_key}>
        <ListItem disablePadding sx={{ display: 'block' }}>
          <ListItemButton
            onClick={() => handleMenuClick(item)}
            sx={{
              minHeight: 48,
              justifyContent: 'initial',
              px: 2.5,
              pl: level === 0 ? 2.5 : 5,
              backgroundColor: active ? 'rgba(102, 126, 234, 0.08)' : 'transparent',
              borderLeft: active ? '3px solid #667eea' : '3px solid transparent',
              '&:hover': {
                backgroundColor: 'rgba(102, 126, 234, 0.12)',
              },
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: 0,
                mr: 2,
                justifyContent: 'center',
                color: active ? '#667eea' : 'inherit',
              }}
            >
              {iconMap[item.menu_icon] || <FolderIcon />}
            </ListItemIcon>
            <ListItemText
              primary={item.menu_label}
              primaryTypographyProps={{
                fontSize: 14,
                fontWeight: active ? 600 : 400,
                color: active ? '#667eea' : 'inherit',
              }}
            />
            {hasChildren && (isOpen ? <ExpandLess /> : <ExpandMore />)}
          </ListItemButton>
        </ListItem>
        {hasChildren && (
          <Collapse in={isOpen} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {item.children!.map((child) => renderMenuItem(child, level + 1))}
            </List>
          </Collapse>
        )}
      </React.Fragment>
    );
  };

  return (
    <Drawer
      variant="permanent"
      open={open}
      sx={{
        width: open ? DRAWER_WIDTH : 0,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH,
          boxSizing: 'border-box',
          background: 'linear-gradient(180deg, #2d3748 0%, #1a202c 100%)',
          color: '#fff',
          borderRight: 'none',
          boxShadow: '2px 0 8px rgba(0,0,0,0.15)',
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar
            sx={{
              width: 40,
              height: 40,
              bgcolor: '#fff',
              color: '#667eea',
              fontWeight: 'bold',
            }}
          >
            {user?.full_name?.charAt(0) || 'U'}
          </Avatar>
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
              {user?.full_name}
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.9, lineHeight: 1.2 }}>
              {user?.role}
            </Typography>
          </Box>
        </Box>
        <IconButton size="small" onClick={onClose} sx={{ color: '#fff' }}>
          <ChevronLeftIcon />
        </IconButton>
      </Box>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />

      {/* Menu Items */}
      <Box sx={{ overflow: 'auto', flex: 1, py: 1 }}>
        <List>{menuItems.map((item) => renderMenuItem(item))}</List>
      </Box>

      {/* Footer */}
      <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="caption" sx={{ opacity: 0.7 }}>
          {companyName} v{version}
        </Typography>
        <Typography variant="caption" sx={{ display: 'block', opacity: 0.5, fontSize: '0.7rem' }}>
          {footerText}
        </Typography>
      </Box>
    </Drawer>
  );
};

export default Sidebar;
