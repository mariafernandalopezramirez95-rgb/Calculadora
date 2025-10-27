

import React, { useState, useEffect, useCallback } from 'react';
import {
  Calculator, Upload, DollarSign, ChevronDown, Plus, Edit, Trash2,
  AlertCircle, Package, TrendingUp, TrendingDown, Eye, Building2,
  Truck, CreditCard, ShoppingCart, Wallet, BookOpen
} from './components/icons';
import { PAISES, DEFAULT_TASAS_DE_CAMBIO } from './constants';
import type { FormState, Producto, HistoricoItem, InversionData, CpaMedio, GastosOperativos, ProductoCalculado, ProfitData, TarjetaDropi, UserProfile, TasasDeCambio } from './types';
import { fmt, fmtDec, convertir } from './utils/formatters';

declare const XLSX: any;

// Helper Icons
const HomeIcon: React.FC<{className?: string}> = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
const SettingsIcon: React.FC<{className?: string}> = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 0 2l-.15.08a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1 0-2l.15.08a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>;
const UserIcon: React.FC<{className?: string}> = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const GoogleIcon: React.FC<{className?: string}> = (props) => <svg {...props} role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.18-1.73 4.1-1.05 1.05-2.36 1.84-4.66 1.84-5.52 0-10-4.48-10-10s4.48-10 10-10c3.04 0 5.25 1.24 6.84 2.73L19.43 4c-1.84-1.73-4.1-2.73-7.43-2.73-6.17 0-11.17 5-11.17 11.17s5 11.17 11.17 11.17c7.04 0 10.74-4.84 10.74-10.92 0-.73-.08-1.44-.2-2.16h-10.32z"/></svg>;


export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [paisSel, setPaisSel] = useState('colombia');
  const [showPaisMenu, setShowPaisMenu] = useState(false);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [historico, setHistorico] = useState<HistoricoItem[]>([]);
  const [importacionActiva, setImportacionActiva] = useState<number | null>(null);
  const [incluirIva, setIncluirIva] = useState(true);

  const [inversionData, setInversionData] = useState<InversionData>({ monto: '', moneda: 'USD', tieneAgencia: false });
  const [cpaMedio, setCpaMedio] = useState<CpaMedio>({ valor: '', moneda: 'USD' });
  const [gastosOperativos, setGastosOperativos] = useState<GastosOperativos>({ shopify: '', tarjetasDropi: [], otros: '' });
  
  const [profile, setProfile] = useState<UserProfile>({ nombre: 'Usuario', empresa: 'Mi Empresa' });
  const [tasasDeCambio, setTasasDeCambio] = useState<TasasDeCambio>(DEFAULT_TASAS_DE_CAMBIO);

  const [form, setForm] = useState<FormState>({ nombre: '', pvp: '', coste: '', envio: '', cpaObj: '' });
  const [editId, setEditId] = useState<number | null>(null);
  const [tasas, setTasas] = useState({ conf: 90, entr: 60 });
  const [cargando, setCargando] = useState(false);
  const [mostrarGastos, setMostrarGastos] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const [expandedMonths, setExpandedMonths] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    try {
      const saved = localStorage.getItem('coinnecta_data_v6');
      if (saved) {
        const data = JSON.parse(saved);
        setProductos(data.productos || []);
        setProfile(data.profile || { nombre: 'Usuario', empresa: 'Mi Empresa' });
        setTasasDeCambio(data.tasasDeCambio || DEFAULT_TASAS_DE_CAMBIO);
        
        const loadedHistorico = data.historico || [];
        setHistorico(loadedHistorico);
        if (loadedHistorico.length > 0) {
            setImportacionActiva(data.importacionActiva || loadedHistorico[0].id);
            const date = new Date(loadedHistorico[0].id);
            const monthYear = date.toLocaleString('es-ES', { month: 'long', year: 'numeric' });
            setExpandedMonths({ [monthYear]: true });
        }
        
        const loadedInversionData = data.inversionData;
        if (loadedInversionData) {
            const hasAgency = loadedInversionData.agencia ? loadedInversionData.agencia !== 'ninguna' : (loadedInversionData.tieneAgencia || false);
            setInversionData({ monto: loadedInversionData.monto || '', moneda: loadedInversionData.moneda || 'USD', tieneAgencia: hasAgency });
        } else {
            setInversionData({ monto: '', moneda: 'USD', tieneAgencia: false });
        }
        
        setGastosOperativos(data.gastosOperativos || { shopify: '', tarjetasDropi: [], otros: '' });
        setCpaMedio(data.cpaMedio || { valor: '', moneda: 'USD' });
      }
    } catch (e) {
      console.error("Failed to load data from localStorage", e);
    }
  }, []);

  useEffect(() => {
    try {
      const dataToSave = JSON.stringify({ productos, historico, importacionActiva, inversionData, gastosOperativos, cpaMedio, profile, tasasDeCambio });
      localStorage.setItem('coinnecta_data_v6', dataToSave);
    } catch (e) {
        console.error("Failed to save data to localStorage", e);
    }
  }, [productos, historico, importacionActiva, inversionData, gastosOperativos, cpaMedio, profile, tasasDeCambio]);

  const calcularProducto = useCallback((): ProductoCalculado | null => {
    const pvp = parseFloat(form.pvp) || 0;
    const coste = parseFloat(form.coste) || 0;
    const envio = parseFloat(form.envio) || 0;
    const cpaObj = parseFloat(form.cpaObj) || 0;

    if (pvp === 0) return null;

    const pais = PAISES[paisSel];
    const ivaFactor = (incluirIva && paisSel !== 'colombia') ? (1 + (pais.iva / 100)) : 1;
    const costeConIva = coste * ivaFactor;
    const beneficioBruto = pvp - costeConIva - envio;
    const margenBruto = (beneficioBruto / pvp) * 100;

    const cpa8 = pvp * 0.08;
    const cpa11 = pvp * 0.11;

    const tasaConf = tasas.conf / 100;
    const tasaEntr = tasas.entr / 100;
    const tasaFinal = tasaConf * tasaEntr;

    const ingresoEsperado = pvp * tasaFinal;
    const costoProductoEsperado = costeConIva * tasaFinal;
    const costoEnvioEsperado = envio * tasaConf;
    const beneficioEspCOD = ingresoEsperado - costoProductoEsperado - costoEnvioEsperado;
    
    let comisionRate = 0;
    if (paisSel === 'colombia' || paisSel === 'mexico') { comisionRate = 0.10; } 
    else if (paisSel === 'espana') { comisionRate = 0.05; }
    
    const comisionTesteo = cpa11 * comisionRate;
    const comisionEscala = cpa8 * comisionRate;
    const comisionObjetivo = cpaObj > 0 ? cpaObj * comisionRate : 0;

    const profitTesteo = beneficioEspCOD - cpa11 - comisionTesteo;
    const profitEscala = beneficioEspCOD - cpa8 - comisionEscala;
    const profitObjetivo = cpaObj > 0 ? beneficioEspCOD - cpaObj - comisionObjetivo : null;

    return {
      coste, costeConIva, envio, beneficioBruto, margenBruto, cpa8, cpa11, cpaObj,
      tasaFinal, ingresoEsperado, costoProductoEsperado, costoEnvioEsperado,
      beneficioEspCOD, profitTesteo, profitEscala, profitObjetivo
    };
  }, [form, paisSel, incluirIva, tasas]);

  const calcProfit = useCallback((importacionId: number): ProfitData | null => {
    const importacion = historico.find(h => h.id === importacionId);
    if (!importacion) return null;

    const datos = importacion.datos;
    const paisData = PAISES[importacion.pais];
    const monedaPais = paisData.moneda;
    const { monto, moneda: monedaInversion, tieneAgencia } = inversionData;
    
    let comisionPorcentaje = 0;
    if (tieneAgencia) {
        if (importacion.pais === 'colombia' || importacion.pais === 'mexico') { comisionPorcentaje = 10; } 
        else if (importacion.pais === 'espana') { comisionPorcentaje = 5; }
    }

    const inversionEnCampana = parseFloat(monto) || 0;
    const comisionAgenciaPublicidad = inversionEnCampana * (comisionPorcentaje / 100);
    const inversionPublicidadTotal = inversionEnCampana + comisionAgenciaPublicidad;
    const inversionPublicidadTotalEnMonedaLocal = convertir(inversionPublicidadTotal, monedaInversion, monedaPais, tasasDeCambio);
    const inversionCampanaEnMonedaLocal = convertir(inversionEnCampana, monedaInversion, monedaPais, tasasDeCambio);
    const comisionAgenciaEnMonedaLocal = convertir(comisionAgenciaPublicidad, monedaInversion, monedaPais, tasasDeCambio);

    const shopify = parseFloat(gastosOperativos.shopify) || 0;
    const otrosGastos = parseFloat(gastosOperativos.otros) || 0;
    let gastosTarjetasTotal = 0;
    gastosOperativos.tarjetasDropi.forEach(t => {
      const montoTarjeta = parseFloat(t.monto) || 0;
      gastosTarjetasTotal += convertir(montoTarjeta, t.moneda, monedaPais, tasasDeCambio);
    });
    const gastosOperativosTotal = convertir(shopify, 'USD', monedaPais, tasasDeCambio) + otrosGastos + gastosTarjetasTotal;

    const facturacion = datos.facturacion || 0;
    const costoProductos = datos.costoProductos || 0;
    const costoEnvioTotal = datos.costoEnvioTotal || 0;
    const costoDevolucionFleteTotal = datos.costoDevolucionFleteTotal || 0;

    const costos = costoProductos + costoEnvioTotal + costoDevolucionFleteTotal;
    const profitOperativo = facturacion - costos;
    const profitNetoAds = profitOperativo - inversionPublicidadTotalEnMonedaLocal;
    const profitFinal = profitNetoAds - gastosOperativosTotal;
    
    const gastosAdsOperativos = inversionPublicidadTotalEnMonedaLocal + gastosOperativosTotal;
    const roi = gastosAdsOperativos > 0 ? (profitFinal / gastosAdsOperativos) * 100 : 0;
    const cpaReal = datos.total > 0 ? inversionPublicidadTotalEnMonedaLocal / datos.total : 0;

    return {
      ...datos, facturacion, costos, profitOperativo, profitNetoAds, profitFinal, 
      inversionPublicidadTotal: inversionPublicidadTotalEnMonedaLocal, gastosOperativosTotal,
      pais: importacion.pais, cpaReal, roi, comisionPorcentaje: comisionPorcentaje,
      inversionMoneda: monedaInversion, inversionEnCampana: inversionCampanaEnMonedaLocal,
      comisionAgenciaPublicidad: comisionAgenciaEnMonedaLocal,
    };
  }, [historico, inversionData, gastosOperativos, tasasDeCambio]);
  
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFeedbackMsg(null); setCargando(true);
    try {
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        if (jsonData.length === 0) throw new Error('El archivo Excel está vacío o no tiene el formato correcto.');

        const getNum = (row: any, keys: (string | number)[]): number => {
            for (const key of keys) { if (row[key] !== undefined) { const val = parseFloat(row[key]); return isNaN(val) ? 0 : val; } } return 0;
        };
        const getStr = (row: any, keys: (string | number)[]): string => {
            for (const key of keys) { if (row[key] !== undefined) { return String(row[key]).toUpperCase().trim(); } } return '';
        };

        const COLS = { STATUS: ['ESTATUS', 'K'], VALOR_COMPRA: ['VALOR DE COMPRA EN PRODUCTOS', 'T'], FLETE: ['PRECIO FLETE', 'V'], COSTO_DEVOLUCION_FLETE: ['COSTO DEVOLUCION FLETE', 'W'], COSTO_PROVEEDOR: ['TOTAL EN PRECIOS DE PROVEEDOR', 'Y'], };
        let totalPedidos = jsonData.length, rechazados = 0, cancelados = 0, duplicados = 0, enRuta = 0, novedades = 0, entregados = 0, rehusadosTransito = 0, rehusadosRecepcionados = 0;
        let facturacionEntregados = 0, facturacionIncidencia = 0, costoProductosEntregados = 0, costoEnvioTotal = 0, costoDevolucionFleteTotal = 0;

        jsonData.forEach((row: any) => {
            const status = getStr(row, COLS.STATUS), valorCompra = getNum(row, COLS.VALOR_COMPRA), costoProveedor = getNum(row, COLS.COSTO_PROVEEDOR), flete = getNum(row, COLS.FLETE), devolucionFlete = getNum(row, COLS.COSTO_DEVOLUCION_FLETE);
            costoEnvioTotal += flete; costoDevolucionFleteTotal += devolucionFlete;
            switch (status) {
                case 'ENTREGADO': entregados++; facturacionEntregados += valorCompra; costoProductosEntregados += costoProveedor; break;
                case 'RECHAZADO': rechazados++; break;
                case 'CANCELADO': cancelados++; break;
                case 'RECLAME EN OFICINA': duplicados++; break;
                case 'NOVEDAD': novedades++; facturacionIncidencia += valorCompra; break;
                case 'DEVOLUCION': case 'EN PROCESO DE DEVOLUCION': rehusadosTransito++; break;
                case 'REHUSADO - RECEPCIONADO EN ALMACÉN': rehusadosRecepcionados++; break;
                case 'EN BODEGA TRANSPORTADORA': case 'EN REPARTO': case 'REENVIO': case 'TELEMERCADEO': enRuta++; break;
            }
        });
        const enviados = totalPedidos - rechazados - cancelados - duplicados;
        const nuevaImportacion: HistoricoItem = {
            id: Date.now(), fecha: new Date().toLocaleString('es-ES'), archivo: file.name, pais: paisSel,
            datos: { total: totalPedidos, entregados, enviados, facturacion: facturacionEntregados, costoProductos: costoProductosEntregados, costoEnvioTotal, costoDevolucionFleteTotal, novedades, facturacionIncidencia, rehusadosTransito, rehusadosRecepcionados, cancelados, rechazados, reclameOficina: duplicados, noConfirmables: cancelados, enRuta, envioIncidencia: 0, enBodega: 0, enReparto: 0, reenvio: 0, }
        };
        const nuevosHistoricos = [nuevaImportacion, ...historico];
        setHistorico(nuevosHistoricos); setImportacionActiva(nuevaImportacion.id);
        const date = new Date(nuevaImportacion.id);
        const monthYear = date.toLocaleString('es-ES', { month: 'long', year: 'numeric' });
        setExpandedMonths(prev => ({ ...prev, [monthYear]: true }));
        setFeedbackMsg({type: 'success', text: `¡Excel importado! ${totalPedidos} pedidos procesados.`});
    } catch (error) {
        console.error("Error processing Excel file:", error);
        const errorMessage = error instanceof Error ? error.message : "Ocurrió un error desconocido.";
        setFeedbackMsg({type: 'error', text: `Error al importar: ${errorMessage}`});
    } finally {
        setCargando(false); if (e.target) e.target.value = ''; setTimeout(() => setFeedbackMsg(null), 5000);
    }
  };
  
  const handleUpdateHistoricoItem = (id: number, updatedData: Partial<HistoricoItem>) => {
    setHistorico(prev => prev.map(item => item.id === id ? { ...item, ...updatedData } : item));
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: HomeIcon },
    { id: 'productos', label: 'Productos', icon: Calculator },
    { id: 'importaciones', label: 'Importaciones', icon: Upload },
    { id: 'historial', label: 'Historial', icon: BookOpen },
    { id: 'configuracion', label: 'Configuración', icon: SettingsIcon },
  ];

  const pais = PAISES[paisSel];
  const profitData = importacionActiva ? calcProfit(importacionActiva) : null;

  if (!isLoggedIn) {
    return <LoginView onLogin={() => setIsLoggedIn(true)} />;
  }

  const renderContent = () => {
    switch (currentPage) {
      case 'dashboard': return <DashboardView profitData={profitData} historico={historico} calcProfit={calcProfit} setCurrentPage={setCurrentPage} />;
      case 'productos': return <ProductosView pais={pais} productos={productos} setProductos={setProductos} form={form} setForm={setForm} editId={editId} setEditId={setEditId} incluirIva={incluirIva} setIncluirIva={setIncluirIva} tasas={tasas} setTasas={setTasas} cpaMedio={cpaMedio} setCpaMedio={setCpaMedio} calcularProducto={calcularProducto} setFeedbackMsg={setFeedbackMsg} setCurrentPage={setCurrentPage} />;
      case 'importaciones': return <ImportacionesView historico={historico} setHistorico={setHistorico} importacionActiva={importacionActiva} setImportacionActiva={setImportacionActiva} handleFileUpload={handleFileUpload} cargando={cargando} feedbackMsg={feedbackMsg} setFeedbackMsg={setFeedbackMsg} calcProfit={calcProfit} />;
      case 'historial': return <HistorialView historico={historico} onUpdateItem={handleUpdateHistoricoItem} calcProfit={calcProfit} />;
      case 'configuracion': return <ConfiguracionView profile={profile} setProfile={setProfile} tasasDeCambio={tasasDeCambio} setTasasDeCambio={setTasasDeCambio} setFeedbackMsg={setFeedbackMsg} onLogout={() => setIsLoggedIn(false)} />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans flex">
      <aside className="w-64 bg-gray-900/80 backdrop-blur-lg border-r border-yellow-500/20 flex flex-col sticky top-0 h-screen">
        <div className="px-6 py-4 border-b border-yellow-500/20">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-200 bg-clip-text text-transparent">Coinnecta Pro</h1>
          <p className="text-xs text-gray-400">Dropshipping Profesional</p>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navItems.map(item => (
            <button key={item.id} onClick={() => setCurrentPage(item.id)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold transition-colors ${currentPage === item.id ? 'bg-yellow-500/20 text-yellow-300' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="px-4 py-4 border-t border-yellow-500/20">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
                <UserIcon className="h-6 w-6 text-yellow-400" />
              </div>
              <div>
                <p className="font-bold text-sm text-white">{profile.nombre}</p>
                <p className="text-xs text-gray-400">{profile.empresa}</p>
              </div>
           </div>
        </div>
      </aside>

      <div className="flex-1 overflow-y-auto">
        <header className="sticky top-0 z-40 bg-gray-900/50 backdrop-blur-lg border-b border-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-end items-center">
            <div className="relative">
              <button onClick={() => setShowPaisMenu(!showPaisMenu)} className="flex items-center gap-2 px-4 py-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg cursor-pointer text-white text-sm font-bold hover:bg-yellow-500/20 transition-colors">
                <span className="text-2xl">{pais.flag}</span>
                <span>{pais.nombre}</span>
                <ChevronDown size={16} />
              </button>
              {showPaisMenu && (
                <div className="absolute top-full right-0 mt-2 bg-gray-800 border border-yellow-500/30 rounded-xl min-w-[200px] shadow-2xl z-50 overflow-hidden">
                  {Object.entries(PAISES).map(([key, p]) => (
                    <button key={key} onClick={() => { setPaisSel(key); setShowPaisMenu(false); }} className={`w-full p-3 text-left ${paisSel === key ? 'bg-yellow-500/20' : 'hover:bg-gray-700'} transition-colors flex items-center gap-3 text-white text-sm`}>
                      <span className="text-2xl">{p.flag}</span>
                      <span className="font-bold">{p.nombre}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {feedbackMsg && (
            <div className={`fixed top-5 right-5 z-50 p-4 rounded-lg font-bold shadow-lg animate-pulse ${feedbackMsg.type === 'success' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
              {feedbackMsg.text}
            </div>
          )}
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

const LoginView = ({ onLogin }) => (
  <div className="min-h-screen w-full flex items-center justify-center bg-gray-900">
    <div className="w-full max-w-md p-8 space-y-8 bg-gray-800 rounded-2xl shadow-2xl border border-yellow-500/30">
      <div className="text-center">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-200 bg-clip-text text-transparent">Coinnecta Pro</h1>
        <p className="mt-2 text-gray-400">Tu centro de control para Dropshipping.</p>
      </div>
      <div className="text-center text-sm text-gray-500">
          <p>Esta es una simulación de inicio de sesión.</p>
          <p>En una aplicación real, esto te conectaría de forma segura a tu cuenta.</p>
      </div>
      <button
        onClick={onLogin}
        className="w-full flex items-center justify-center gap-3 py-3 px-4 font-bold text-gray-800 bg-white rounded-lg hover:bg-gray-200 transition-colors"
      >
        <GoogleIcon className="w-6 h-6" />
        <span>Iniciar sesión con Google</span>
      </button>
    </div>
  </div>
);

const DashboardView = ({ profitData, historico, calcProfit, setCurrentPage }) => {
    const profitHistory = historico
        .map(h => ({
            id: h.id,
            profit: calcProfit(h.id)?.profitFinal || 0,
            date: new Date(h.id).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
        }))
        .slice(0, 10)
        .reverse();

    const maxProfit = Math.max(...profitHistory.map(p => Math.abs(p.profit)), 1);

    if (!profitData) {
        return (
            <div className="bg-gray-800 p-10 rounded-2xl border border-yellow-500/30 text-center">
                <AlertCircle size={48} className="mx-auto mb-4 text-yellow-500" />
                <h3 className="text-xl font-bold text-white">Bienvenido a Coinnecta Pro</h3>
                <p className="text-gray-400 mt-2 mb-6">Importa tu primer reporte de Excel para empezar a analizar tus resultados.</p>
                <button onClick={() => setCurrentPage('importaciones')} className="py-2 px-5 bg-yellow-500 hover:bg-yellow-600 text-black font-bold rounded-lg transition">Ir a Importaciones</button>
            </div>
        );
    }
    
    const tasaEntrega = profitData.enviados > 0 ? (profitData.entregados / profitData.enviados) * 100 : 0;

    return (
      <div className="space-y-6">
          <h2 className="text-3xl font-bold text-white">Dashboard</h2>
          <p className="text-gray-400 -mt-4">Resumen de tu última importación.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-gradient-to-br from-green-500 to-green-700 p-6 rounded-2xl text-white">
                  <p className="text-sm font-bold opacity-80">Profit Final</p>
                  <p className="text-4xl font-bold mt-2">{PAISES[profitData.pais].simbolo}{fmt(profitData.profitFinal)}</p>
              </div>
              <div className="bg-gray-800 p-6 rounded-2xl">
                  <p className="text-sm font-bold text-gray-400">Facturación</p>
                  <p className="text-4xl font-bold mt-2 text-yellow-400">{PAISES[profitData.pais].simbolo}{fmt(profitData.facturacion)}</p>
              </div>
              <div className="bg-gray-800 p-6 rounded-2xl">
                  <p className="text-sm font-bold text-gray-400">Pedidos Totales</p>
                  <p className="text-4xl font-bold mt-2">{fmt(profitData.total)}</p>
              </div>
              <div className="bg-gray-800 p-6 rounded-2xl">
                  <p className="text-sm font-bold text-gray-400">Tasa de Entrega</p>
                  <p className="text-4xl font-bold mt-2 text-blue-400">{fmtDec(tasaEntrega)}%</p>
              </div>
          </div>
          
          <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700">
              <h3 className="text-xl font-bold text-white mb-4">Historial de Profit</h3>
              {profitHistory.length > 0 ? (
                  <div className="h-64 flex gap-4 items-end">
                      {profitHistory.map(p => {
                          const height = (Math.abs(p.profit) / maxProfit) * 100;
                          const isNegative = p.profit < 0;
                          return (
                              <div key={p.id} className="flex-1 flex flex-col items-center justify-end">
                                  <p className={`text-xs font-bold ${isNegative ? 'text-red-400' : 'text-green-400'}`}>{fmt(p.profit)}</p>
                                  <div className={`w-full rounded-t-md ${isNegative ? 'bg-red-500' : 'bg-green-500'}`} style={{ height: `${height}%` }}></div>
                                  <p className="text-xs text-gray-400 mt-2">{p.date}</p>
                              </div>
                          )
                      })}
                  </div>
              ) : (
                  <p className="text-gray-500 text-center py-10">No hay suficiente historial para mostrar un gráfico.</p>
              )}
          </div>
      </div>
    );
}

const ProductosView = ({ pais, productos, setProductos, form, setForm, editId, setEditId, incluirIva, setIncluirIva, tasas, setTasas, cpaMedio, setCpaMedio, calcularProducto, setFeedbackMsg, setCurrentPage }) => {
    
  const metricas = calcularProducto();
  const prodsPais = productos.filter(p => p.pais === pais.nombre.toLowerCase());

  const handleSubmit = () => {
    if (!form.nombre || !form.pvp) {
      setFeedbackMsg({type: 'error', text: 'Completa nombre y precio de venta.'});
      setTimeout(() => setFeedbackMsg(null), 3000);
      return;
    }
    const metricasCalc = calcularProducto();
    if (!metricasCalc) return;
    if (editId) {
      setProductos(productos.map(p => p.id === editId ? { ...p, ...form, ...metricasCalc, pais: pais.nombre.toLowerCase(), incluirIva } : p));
      setEditId(null);
    } else {
      setProductos([...productos, { id: Date.now(), ...form, ...metricasCalc, pais: pais.nombre.toLowerCase(), incluirIva }]);
    }
    setForm({ nombre: '', pvp: '', coste: '', envio: '', cpaObj: '' });
  };

  const handleEdit = (p: Producto) => {
    setEditId(p.id);
    setForm({ nombre: p.nombre, pvp: p.pvp, coste: String(p.coste), envio: String(p.envio), cpaObj: p.cpaObj ? String(p.cpaObj) : '' });
    setIncluirIva(p.incluirIva !== undefined ? p.incluirIva : true);
    window.scrollTo(0, 0);
  };
  
  const handleDelete = (id: number) => {
    if (window.confirm('¿Eliminar este producto?')) { setProductos(productos.filter(p => p.id !== id)); }
  };
    
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
           <div className="space-y-6">
                 <div className="bg-gray-800 p-6 rounded-2xl border border-yellow-500/30">
                    <h2 className="text-xl font-bold mb-5 text-yellow-400 flex items-center gap-2">{editId ? <Edit size={22} /> : <Plus size={22} />} {editId ? 'Editar Producto' : 'Calcular Producto'}</h2>
                     <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold mb-2 text-gray-300">📦 Nombre del Producto</label>
                            <input type="text" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} placeholder="Ej: Gafas de sol polarizadas" className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none transition" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-bold mb-2 text-gray-300">💰 Precio Venta ({pais.simbolo})</label>
                                <input type="number" value={form.pvp} onChange={(e) => setForm({ ...form, pvp: e.target.value })} placeholder="22000" className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none transition" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-2 text-gray-300">🏷️ Coste Producto</label>
                                <input type="number" value={form.coste} onChange={(e) => setForm({ ...form, coste: e.target.value })} placeholder="4680" className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none transition" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-2 text-gray-300">📮 Coste Envío</label>
                                <input type="number" value={form.envio} onChange={(e) => setForm({ ...form, envio: e.target.value })} placeholder="4680" className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none transition" />
                            </div>
                        </div>
                        {pais.nombre.toLowerCase() !== 'colombia' && (
                          <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg flex justify-between items-center">
                              <div>
                                  <div className="text-sm font-bold text-gray-300">📊 ¿Añadir IVA al coste? ({pais.iva}%)</div>
                                  <div className="text-xs text-gray-400 mt-1">Activa si el proveedor cobra IVA</div>
                              </div>
                              <button onClick={() => setIncluirIva(!incluirIva)} className={`p-1 w-14 rounded-full transition-colors duration-300 ${incluirIva ? 'bg-green-500' : 'bg-gray-600'}`}>
                                  <span className={`block w-6 h-6 rounded-full bg-white transform transition-transform duration-300 ${incluirIva ? 'translate-x-6' : ''}`}></span>
                              </button>
                          </div>
                        )}
                     </div>
                 </div>
                 {metricas && (
                   <div className="bg-gray-800 p-6 rounded-2xl border border-yellow-500/30">
                     <h3 className="text-lg font-bold mb-4 text-yellow-400">💰 PROFIT POR PEDIDO ENTREGADO</h3>
                      <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="bg-blue-500/20 p-4 rounded-lg text-center">
                                <p className="text-xs text-gray-400">🧪 Testeo (CPA 11%)</p>
                                <p className={`my-1 text-2xl font-bold ${metricas.profitTesteo >= 0 ? 'text-green-400' : 'text-red-400'}`}>{pais.simbolo}{fmt(metricas.profitTesteo)}</p>
                              </div>
                              <div className="bg-green-500/20 p-4 rounded-lg text-center border-2 border-green-500/50">
                                <p className="text-xs text-gray-400">📈 Escala (CPA 8%)</p>
                                <p className={`my-1 text-2xl font-bold ${metricas.profitEscala >= 0 ? 'text-green-400' : 'text-red-400'}`}>{pais.simbolo}{fmt(metricas.profitEscala)}</p>
                              </div>
                            </div>
                          </div>
                   </div>
                 )}
                 <div className="flex gap-2 mt-6">
                    {editId && (
                      <button onClick={() => { setEditId(null); setForm({ nombre: '', pvp: '', coste: '', envio: '', cpaObj: '' }); }} className="flex-1 py-3 px-4 bg-gray-600 hover:bg-gray-500 text-white font-bold rounded-lg transition">Cancelar</button>
                    )}
                    <button onClick={handleSubmit} className="flex-1 py-3 px-4 bg-gradient-to-br from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black font-bold rounded-lg transition flex items-center justify-center gap-2"><Plus size={20} /> {editId ? 'Actualizar Producto' : 'Guardar Producto'}</button>
                </div>
            </div>
            <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700">
                 <h3 className="text-xl font-bold mb-5 text-gray-300">📦 Productos Guardados ({prodsPais.length})</h3>
                  {prodsPais.length === 0 ? (
                    <div className="text-center py-16 text-gray-500">
                      <Package size={48} className="mx-auto mb-4 opacity-30" />
                      <p>No hay productos guardados para {pais.nombre}</p>
                      <p className="text-sm mt-2">Agrega tu primer producto</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {prodsPais.map(p => (
                          <div key={p.id} className="bg-gray-900/50 p-4 rounded-lg flex justify-between items-center gap-4">
                            <div className="flex-1">
                              <h4 className="font-bold text-white">{p.nombre}</h4>
                              <p className="text-xs text-gray-400 mt-1">PVP: {pais.simbolo}{fmt(p.pvp)} • Coste Total: {pais.simbolo}{fmt(p.costeConIva + p.envio)}</p>
                              <p className={`mt-1 text-sm font-bold ${p.profitEscala >= 0 ? 'text-green-400' : 'text-red-400'}`}>Profit Escala: {pais.simbolo}{fmt(p.profitEscala)}</p>
                            </div>
                            <div className="flex gap-2">
                              <button onClick={() => handleEdit(p)} className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-md transition"><Edit size={16} /></button>
                              <button onClick={() => handleDelete(p.id)} className="p-2 bg-red-600 hover:bg-red-500 text-white rounded-md transition"><Trash2 size={16} /></button>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
            </div>
        </div>
    )
}

const ImportacionesView = ({ historico, setHistorico, importacionActiva, setImportacionActiva, handleFileUpload, cargando, feedbackMsg, setFeedbackMsg, calcProfit }) => {
    
    if (!historico || historico.length === 0) {
        return (
            <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700">
                <h2 className="text-xl font-bold mb-2 text-gray-300">📤 Importar Excel de Pedidos</h2>
                <p className="text-sm text-gray-400 mb-6">Sube tu primer archivo Excel para ver los resultados.</p>
                 <div className="bg-gray-900/50 p-6 rounded-xl border-2 border-dashed border-gray-600 text-center">
                    <Upload size={40} className="mx-auto text-gray-500 mb-4" />
                    <label htmlFor="file-upload" className="relative cursor-pointer bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-2 px-4 rounded-lg transition-colors">
                        <span>{cargando ? 'Procesando...' : 'Seleccionar archivo'}</span>
                    </label>
                    <input id="file-upload" name="file-upload" type="file" className="sr-only" accept=".xlsx,.xls" onChange={handleFileUpload} disabled={cargando} />
                    <p className="mt-4 text-xs text-gray-500">Soporta archivos .xlsx y .xls</p>
                </div>
            </div>
        )
    }

    const profitData = importacionActiva ? calcProfit(importacionActiva) : null;

    if (!profitData) {
        return (
            <div className="text-center p-10">
                <AlertCircle className="mx-auto h-12 w-12 text-yellow-500" />
                <h3 className="mt-2 text-lg font-medium">No se pudo calcular el profit.</h3>
                <p className="mt-1 text-sm text-gray-500">Selecciona una importación válida del historial.</p>
            </div>
        )
    }

    return (
        <div className="grid grid-cols-12 gap-6">
            <div className="col-span-12 lg:col-span-4 space-y-4">
                <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                     <h3 className="text-lg font-bold mb-4 text-gray-300">📤 Nueva Importación</h3>
                     <div className="bg-gray-900/50 p-4 rounded-xl border-2 border-dashed border-gray-600 text-center">
                        <label htmlFor="file-upload" className="relative cursor-pointer bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-2 px-4 rounded-lg transition-colors">
                            <span>{cargando ? 'Procesando...' : 'Subir otro archivo'}</span>
                        </label>
                        <input id="file-upload" name="file-upload" type="file" className="sr-only" accept=".xlsx,.xls" onChange={handleFileUpload} disabled={cargando} />
                    </div>
                </div>
                <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                    <h3 className="text-lg font-bold mb-4 text-gray-300">📋 Histórico de Importaciones</h3>
                     <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                        {historico.map(h => (
                            <button key={h.id} onClick={() => setImportacionActiva(h.id)} className={`w-full text-left p-3 rounded-lg flex items-center gap-2 transition-colors ${importacionActiva === h.id ? 'bg-yellow-500/20 border border-yellow-500/30' : 'bg-gray-700/50 hover:bg-gray-700'}`}>
                                <span className="text-xl">{PAISES[h.pais].flag}</span>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-xs text-white truncate" title={h.archivo}>{h.nombreEditable || h.archivo}</h4>
                                    <p className="text-[10px] text-gray-400">{new Date(h.id).toLocaleDateString()}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
            <div className="col-span-12 lg:col-span-8 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-blue-600 text-white p-3 rounded-lg text-center"><h5 className="text-xs font-bold uppercase">Profit Operativo</h5><p className="font-bold text-2xl mt-1">{PAISES[profitData.pais].simbolo}{fmt(profitData.profitOperativo)}</p></div>
                    <div className="bg-teal-600 text-white p-3 rounded-lg text-center"><h5 className="text-xs font-bold uppercase">Profit Neto (Tras Ads)</h5><p className="font-bold text-2xl mt-1">{PAISES[profitData.pais].simbolo}{fmt(profitData.profitNetoAds)}</p></div>
                    <div className="bg-black text-lime-400 p-3 rounded-lg text-center border-2 border-lime-400"><h5 className="text-xs font-bold uppercase text-white">Profit Final (Total)</h5><p className="font-bold text-2xl mt-1">{PAISES[profitData.pais].simbolo}{fmt(profitData.profitFinal)}</p></div>
                </div>
                <div className="bg-gray-800 p-4 rounded-lg mt-4 border border-gray-700">
                   <h3 className="font-bold text-center text-white mb-4">COSTO - BENEFICIO</h3>
                   <div className="w-full h-64 flex justify-around items-end gap-2 text-white text-xs text-center">
                        {[
                            {label: 'FACTURACIÓN', value: profitData.facturacion, color: 'bg-green-500'},
                            {label: 'INVERSIÓN', value: profitData.inversionEnCampana, color: 'bg-purple-500'},
                            ...(profitData.comisionAgenciaPublicidad > 0 ? [{label: 'AGENCIA', percent: profitData.comisionPorcentaje, value: profitData.comisionAgenciaPublicidad, color: 'bg-indigo-500'}] : []),
                            {label: 'PRODUCTOS', value: profitData.costoProductos, color: 'bg-red-600'},
                            {label: 'ENVÍO', value: profitData.costoEnvioTotal, color: 'bg-blue-500'},
                            {label: profitData.pais === 'colombia' ? 'FLETE PERDIDO' : 'FLETE DEV', value: profitData.costoDevolucionFleteTotal, color: 'bg-red-800'},
                            ...(profitData.gastosOperativosTotal > 0 ? [{label: 'GASTOS OP.', value: profitData.gastosOperativosTotal, color: 'bg-pink-500'}] : [])
                        ].map(bar => {
                            const maxVal = Math.max(profitData.facturacion, 1);
                            const height = (bar.value / maxVal) * 90;
                            return (
                            <div key={bar.label} className="h-full flex flex-col justify-end items-center flex-1">
                                <p className="font-bold text-lime-300 text-[10px]">{PAISES[profitData.pais].simbolo}{fmt(bar.value)}</p>
                                <div className={`${bar.color} w-4/5 rounded-t-sm border-2 border-black/30 relative`} style={{height: `${height}%`}}><div className="absolute -top-1 left-0 w-full h-2 bg-white/20 rounded-t-sm"></div></div>
                                <p className="mt-1 font-bold text-[10px] uppercase">{bar.label}{'percent' in bar && bar.percent != null && <span className="text-gray-400 font-medium normal-case ml-1">({bar.percent}%)</span>}</p>
                            </div>
                            )
                        })}
                   </div>
                </div>
            </div>
        </div>
    );
}

const HistorialView = ({ historico, onUpdateItem, calcProfit }) => {
    const [viewMode, setViewMode] = useState('mes'); // 'semana', 'mes', 'año'

    const getWeekKey = (d: Date) => {
        const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
        date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
        const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
        const weekNo = Math.ceil((((date.valueOf() - yearStart.valueOf()) / 86400000) + 1) / 7);
        return `${date.getUTCFullYear()}-W${weekNo}`;
    };
    
    const getWeekDisplay = (d: Date) => {
        const date = new Date(d);
        const day = date.getDay();
        const diffToMonday = date.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(date.setDate(diffToMonday));
        const sunday = new Date(new Date(monday).setDate(monday.getDate() + 6));
        // FIX: Explicitly type options for toLocaleDateString to avoid type inference issues.
        const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
        return `Semana del ${monday.toLocaleDateString('es-ES', options)} al ${sunday.toLocaleDateString('es-ES', options)}`;
    }

    const groupedData = historico.reduce((acc, item) => {
        const date = new Date(item.id);
        let key, display;
        if (viewMode === 'año') {
            key = date.getFullYear().toString();
            display = key;
        } else if (viewMode === 'semana') {
            key = getWeekKey(date);
            display = getWeekDisplay(date);
        } else { // mes
            key = date.toLocaleString('es-ES', { month: 'long', year: 'numeric' });
            display = key;
        }

        if (!acc[key]) acc[key] = { display, items: [], totalProfit: 0 };
        acc[key].items.push(item);
        acc[key].totalProfit += calcProfit(item.id)?.profitFinal || 0;
        return acc;
    }, {});
    
    const sortedGroupKeys = Object.keys(groupedData).sort((a,b) => {
        // A bit complex to sort week/month/year keys correctly in descending order
        const itemA = groupedData[a].items[0];
        const itemB = groupedData[b].items[0];
        return itemB.id - itemA.id;
    });

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold text-white">Historial de Actividad</h2>
                <div className="flex gap-1 bg-gray-800 p-1 rounded-lg">
                    {['Semana', 'Mes', 'Año'].map(mode => (
                        <button key={mode} onClick={() => setViewMode(mode.toLowerCase())} className={`px-4 py-1.5 text-sm font-bold rounded-md transition ${viewMode === mode.toLowerCase() ? 'bg-yellow-500 text-black' : 'text-gray-300 hover:bg-gray-700'}`}>{mode}</button>
                    ))}
                </div>
            </div>
            
            {sortedGroupKeys.length === 0 ? (
                <div className="text-center py-16 text-gray-500">
                    <BookOpen size={48} className="mx-auto mb-4 opacity-30" />
                    <p>No hay importaciones en tu historial.</p>
                </div>
            ) : (
                <div className="space-y-8">
                    {sortedGroupKeys.map(key => {
                        const group = groupedData[key];
                        return (
                            <div key={key} className="bg-gray-800/50 p-6 rounded-2xl border border-gray-700">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-xl font-bold text-yellow-400 capitalize">{group.display}</h3>
                                    <div className="text-right">
                                        <p className="text-sm text-gray-400">Profit del Periodo</p>
                                        <p className={`font-bold text-lg ${group.totalProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>{fmt(group.totalProfit)} USD</p>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    {group.items.map(item => <HistoricoItemCard key={item.id} item={item} onUpdate={onUpdateItem} />)}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    );
};

const HistoricoItemCard = ({ item, onUpdate }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [nombre, setNombre] = useState(item.nombreEditable || item.archivo);
    const [anotaciones, setAnotaciones] = useState(item.anotaciones || '');

    const handleBlur = () => {
        setIsEditing(false);
        onUpdate(item.id, { nombreEditable: nombre, anotaciones });
    }

    return (
        <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
            <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                    {isEditing ? (
                        <input 
                            type="text"
                            value={nombre}
                            onChange={(e) => setNombre(e.target.value)}
                            onBlur={handleBlur}
                            onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                            className="w-full bg-gray-700 text-white font-bold p-1 rounded-md outline-none focus:ring-2 focus:ring-yellow-500"
                            autoFocus
                        />
                    ) : (
                        <h4 onDoubleClick={() => setIsEditing(true)} className="font-bold text-white cursor-pointer" title="Double-click to edit">{nombre}</h4>
                    )}
                    <p className="text-xs text-gray-500 mt-1">{new Date(item.id).toLocaleString('es-ES')} - {item.datos.total} pedidos</p>
                </div>
                <div className="text-right">
                    <p className="text-sm font-bold">{PAISES[item.pais].flag} {PAISES[item.pais].nombre}</p>
                    <p className="text-xs text-gray-400">Fact: {PAISES[item.pais].simbolo}{fmt(item.datos.facturacion)}</p>
                </div>
            </div>
            <div className="mt-4">
                <textarea
                    value={anotaciones}
                    onChange={(e) => setAnotaciones(e.target.value)}
                    onBlur={handleBlur}
                    placeholder="Añadir anotaciones... (campañas, eventos, ideas...)"
                    className="w-full p-2 bg-gray-800 text-gray-300 text-sm rounded-md border border-gray-700 focus:ring-2 focus:ring-yellow-500 outline-none transition"
                    rows={2}
                ></textarea>
            </div>
        </div>
    )
};


const ConfiguracionView = ({ profile, setProfile, tasasDeCambio, setTasasDeCambio, setFeedbackMsg, onLogout }) => {

    const handleRateChange = (currency: string, value: string) => {
        setTasasDeCambio(prev => ({ ...prev, [currency]: parseFloat(value) || 0 }));
    }

    const handleSave = () => {
        setFeedbackMsg({type: 'success', text: 'Configuración guardada exitosamente.'});
        setTimeout(() => setFeedbackMsg(null), 3000);
    }

    return (
        <div className="space-y-8 max-w-3xl mx-auto">
            <div className="bg-gray-800 p-6 rounded-2xl border border-yellow-500/30">
                <h2 className="text-2xl font-bold text-yellow-400 mb-4">Perfil de Usuario</h2>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold mb-2 text-gray-300">Tu Nombre</label>
                        <input type="text" value={profile.nombre} onChange={e => setProfile({...profile, nombre: e.target.value})} className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold mb-2 text-gray-300">Nombre de la Empresa</label>
                        <input type="text" value={profile.empresa} onChange={e => setProfile({...profile, empresa: e.target.value})} className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg" />
                    </div>
                </div>
            </div>

            <div className="bg-gray-800 p-6 rounded-2xl border border-blue-500/30">
                <h2 className="text-2xl font-bold text-blue-400 mb-4">Tasas de Cambio (a 1 USD)</h2>
                <div className="space-y-4">
                    {/* FIX: Use Object.keys to iterate over tasasDeCambio to avoid type issues with Object.entries returning `unknown` for values. */}
                    {Object.keys(tasasDeCambio).map((currency) => (
                        <div key={currency}>
                            <label className="block text-sm font-bold mb-2 text-gray-300">{currency}</label>
                            <input type="number" value={tasasDeCambio[currency]} onChange={e => handleRateChange(currency, e.target.value)} className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg" />
                        </div>
                    ))}
                </div>
            </div>
            
            <button onClick={handleSave} className="w-full py-3 px-4 bg-gradient-to-br from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black font-bold rounded-lg transition">Guardar Configuración</button>
            <button onClick={onLogout} className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition mt-4">Cerrar Sesión</button>
        </div>
    );
}