
import React, { useState, useEffect, useCallback } from 'react';
import {
  Calculator, Upload, DollarSign, ChevronDown, Plus, Edit, Trash2,
  AlertCircle, Package, TrendingUp, TrendingDown, Eye, Building2,
  Truck, CreditCard, ShoppingCart, Wallet
} from './components/icons';
import { PAISES, AGENCIAS } from './constants';
import type { FormState, Producto, HistoricoItem, InversionData, CpaMedio, GastosOperativos, ProductoCalculado, ProfitData, ImportacionDatos, TarjetaDropi } from './types';
import { fmt, fmtDec, convertir } from './utils/formatters';

// This is a dynamic import, so we need to declare the type for the module.
// In a real project with a build system, you'd add this via `npm install --save-dev @types/xlsx`.
declare const XLSX: any;

export default function App() {
  const [activeTab, setActiveTab] = useState('calcular');
  const [paisSel, setPaisSel] = useState('colombia');
  const [showPaisMenu, setShowPaisMenu] = useState(false);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [historico, setHistorico] = useState<HistoricoItem[]>([]);
  const [importacionActiva, setImportacionActiva] = useState<number | null>(null);
  const [incluirIva, setIncluirIva] = useState(true);

  const [inversionData, setInversionData] = useState<InversionData>({
    monto: '',
    moneda: 'USD',
    agencia: 'ninguna'
  });

  const [cpaMedio, setCpaMedio] = useState<CpaMedio>({ valor: '', moneda: 'USD' });

  const [gastosOperativos, setGastosOperativos] = useState<GastosOperativos>({
    shopify: '', tarjetasDropi: [], otros: ''
  });

  const [form, setForm] = useState<FormState>({ nombre: '', pvp: '', coste: '', envio: '', cpaObj: '' });
  const [editId, setEditId] = useState<number | null>(null);
  const [tasas, setTasas] = useState({ conf: 90, entr: 60 });
  const [cargando, setCargando] = useState(false);
  const [mostrarGastos, setMostrarGastos] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{type: 'success' | 'error', text: string} | null>(null);


  useEffect(() => {
    try {
      const saved = localStorage.getItem('coinnecta_data_v5');
      if (saved) {
        const data = JSON.parse(saved);
        setProductos(data.productos || []);
        setHistorico(data.historico || []);
        setInversionData(data.inversionData || { monto: '', moneda: 'USD', agencia: 'ninguna' });
        setGastosOperativos(data.gastosOperativos || { shopify: '', tarjetasDropi: [], otros: '' });
        setCpaMedio(data.cpaMedio || { valor: '', moneda: 'USD' });
      }
    } catch (e) {
      console.error("Failed to load data from localStorage", e);
    }
  }, []);

  useEffect(() => {
    try {
      const dataToSave = JSON.stringify({ productos, historico, inversionData, gastosOperativos, cpaMedio });
      localStorage.setItem('coinnecta_data_v5', dataToSave);
    } catch (e) {
        console.error("Failed to save data to localStorage", e);
    }
  }, [productos, historico, inversionData, gastosOperativos, cpaMedio]);

  const calcular = useCallback((): ProductoCalculado | null => {
    const pvp = parseFloat(form.pvp) || 0;
    const coste = parseFloat(form.coste) || 0;
    const envio = parseFloat(form.envio) || 0;
    const cpaObj = parseFloat(form.cpaObj) || 0;

    if (pvp === 0) return null;

    const pais = PAISES[paisSel];
    const ivaFactor = incluirIva ? (1 + (pais.iva / 100)) : 1;
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
    
    const comisionAgencia = paisSel === 'colombia' ? pvp * 0.10 : 0;

    const profitTesteo = beneficioEspCOD - cpa8 - comisionAgencia;
    const profitEscala = beneficioEspCOD - cpa11 - comisionAgencia;
    const profitObjetivo = cpaObj > 0 ? beneficioEspCOD - cpaObj - comisionAgencia : null;

    return {
      coste, costeConIva, envio, beneficioBruto, margenBruto, cpa8, cpa11, cpaObj,
      tasaFinal, ingresoEsperado, costoProductoEsperado, costoEnvioEsperado,
      beneficioEspCOD, profitTesteo, profitEscala, profitObjetivo
    };
  }, [form, paisSel, incluirIva, tasas]);
  
  const handleSubmit = () => {
    if (!form.nombre || !form.pvp) {
      setFeedbackMsg({type: 'error', text: 'Completa nombre y precio de venta.'});
      setTimeout(() => setFeedbackMsg(null), 3000);
      return;
    }

    const metricas = calcular();
    if (!metricas) return;

    if (editId) {
      setProductos(productos.map(p =>
        p.id === editId ? { ...p, ...form, ...metricas, pais: paisSel, incluirIva } : p
      ));
      setEditId(null);
    } else {
      setProductos([...productos, {
        id: Date.now(),
        ...form,
        ...metricas,
        pais: paisSel,
        incluirIva
      }]);
    }
    setForm({ nombre: '', pvp: '', coste: '', envio: '', cpaObj: '' });
  };

  const handleEdit = (p: Producto) => {
    setEditId(p.id);
    setForm({ nombre: p.nombre, pvp: p.pvp, coste: String(p.coste), envio: String(p.envio), cpaObj: p.cpaObj ? String(p.cpaObj) : '' });
    setPaisSel(p.pais);
    setIncluirIva(p.incluirIva !== undefined ? p.incluirIva : true);
    setActiveTab('calcular');
    window.scrollTo(0, 0);
  };

  const handleDelete = (id: number) => {
    if (window.confirm('¿Eliminar este producto?')) {
      setProductos(productos.filter(p => p.id !== id));
    }
  };

  const agregarTarjeta = () => {
    setGastosOperativos(prev => ({
      ...prev,
      tarjetasDropi: [...prev.tarjetasDropi, { id: Date.now(), nombre: '', monto: '', moneda: 'COP' }]
    }));
  };

  const actualizarTarjeta = (id: number, campo: keyof TarjetaDropi, valor: string) => {
    setGastosOperativos(prev => ({
      ...prev,
      tarjetasDropi: prev.tarjetasDropi.map(t =>
        t.id === id ? { ...t, [campo]: valor } : t
      )
    }));
  };

  const eliminarTarjeta = (id: number) => {
    setGastosOperativos(prev => ({
      ...prev,
      tarjetasDropi: prev.tarjetasDropi.filter(t => t.id !== id)
    }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setFeedbackMsg(null);
    setCargando(true);

    try {
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        if (jsonData.length === 0) {
            throw new Error('El archivo Excel está vacío o no tiene el formato correcto.');
        }

        const getNum = (row: any, keys: (string | number)[]): number => {
            for (const key of keys) { if (row[key] !== undefined) { const val = parseFloat(row[key]); return isNaN(val) ? 0 : val; } }
            return 0;
        };

        const getStr = (row: any, keys: (string | number)[]): string => {
            for (const key of keys) { if (row[key] !== undefined) { return String(row[key]).toUpperCase().trim(); } }
            return '';
        };

        const COLS = {
            STATUS: ['ESTATUS', 'K'],
            VALOR_COMPRA: ['VALOR DE COMPRA EN PRODUCTOS', 'T'],
            FLETE: ['PRECIO FLETE', 'V'],
            COSTO_DEVOLUCION_FLETE: ['COSTO DEVOLUCION FLETE', 'W'],
            COSTO_PROVEEDOR: ['TOTAL EN PRECIOS DE PROVEEDOR', 'Y'],
        };
        
        let totalPedidos = jsonData.length;
        let rechazados = 0, cancelados = 0, duplicados = 0, enRuta = 0, novedades = 0;
        let entregados = 0, rehusadosTransito = 0, rehusadosRecepcionados = 0;
        
        let facturacionEntregados = 0, facturacionIncidencia = 0;
        let costoProductosEntregados = 0, costoEnvioTotal = 0, costoDevolucionFleteTotal = 0;

        jsonData.forEach((row: any) => {
            const status = getStr(row, COLS.STATUS);
            const valorCompra = getNum(row, COLS.VALOR_COMPRA);
            const costoProveedor = getNum(row, COLS.COSTO_PROVEEDOR);
            const flete = getNum(row, COLS.FLETE);
            const devolucionFlete = getNum(row, COLS.COSTO_DEVOLUCION_FLETE);

            costoEnvioTotal += flete;
            costoDevolucionFleteTotal += devolucionFlete;

            switch (status) {
                case 'ENTREGADO':
                    entregados++;
                    facturacionEntregados += valorCompra;
                    costoProductosEntregados += costoProveedor;
                    break;
                case 'RECHAZADO':
                    rechazados++;
                    break;
                case 'CANCELADO':
                    cancelados++;
                    break;
                case 'RECLAME EN OFICINA':
                    duplicados++;
                    break;
                case 'NOVEDAD':
                    novedades++;
                    facturacionIncidencia += valorCompra;
                    break;
                case 'DEVOLUCION':
                case 'EN PROCESO DE DEVOLUCION':
                    rehusadosTransito++;
                    break;
                case 'REHUSADO - RECEPCIONADO EN ALMACÉN':
                    rehusadosRecepcionados++;
                    break;
                case 'EN BODEGA TRANSPORTADORA':
                case 'EN REPARTO':
                case 'REENVIO':
                case 'TELEMERCADEO':
                    enRuta++;
                    break;
                // Ignored statuses: NOVEDAD SOLUCIONADA, etc.
            }
        });
        
        const enviados = totalPedidos - rechazados - cancelados - duplicados;

        const nuevaImportacion: HistoricoItem = {
            id: Date.now(),
            fecha: new Date().toLocaleString('es-ES'),
            archivo: file.name,
            pais: paisSel,
            datos: {
                total: totalPedidos, 
                entregados, 
                enviados, 
                facturacion: facturacionEntregados,
                costoProductos: costoProductosEntregados, 
                costoEnvioTotal,
                costoDevolucionFleteTotal,
                novedades, 
                facturacionIncidencia,
                rehusadosTransito, 
                rehusadosRecepcionados, 
                cancelados,
                rechazados, 
                reclameOficina: duplicados, 
                noConfirmables: cancelados,
                enRuta,
                // Deprecated fields for compatibility
                envioIncidencia: 0, enBodega: 0, enReparto: 0, reenvio: 0,
            }
        };

        const nuevosHistoricos = [nuevaImportacion, ...historico];
        setHistorico(nuevosHistoricos);
        setImportacionActiva(nuevaImportacion.id);
        setFeedbackMsg({type: 'success', text: `¡Excel importado! ${totalPedidos} pedidos procesados.`});
        setActiveTab('resultados');

    } catch (error) {
        console.error("Error processing Excel file:", error);
        const errorMessage = error instanceof Error ? error.message : "Ocurrió un error desconocido.";
        setFeedbackMsg({type: 'error', text: `Error al importar: ${errorMessage}`});
    } finally {
        setCargando(false);
        if (e.target) e.target.value = '';
        setTimeout(() => setFeedbackMsg(null), 5000);
    }
  };

  const verResultados = (importacionId: number) => {
    setImportacionActiva(importacionId);
    setActiveTab('resultados');
    window.scrollTo(0,0);
  };

  const calcProfit = useCallback((importacionId: number): ProfitData | null => {
    const importacion = historico.find(h => h.id === importacionId);
    if (!importacion) return null;

    const datos = importacion.datos;
    const paisData = PAISES[importacion.pais];
    const monedaPais = paisData.moneda;

    // --- Inversión y Agencia ---
    const { monto, moneda: monedaInversion, agencia: agenciaKey } = inversionData;
    const agencia = AGENCIAS[agenciaKey];
    const inversionEnCampana = parseFloat(monto) || 0;
    const comisionAgenciaPublicidad = inversionEnCampana * (agencia.comision / 100);
    const inversionPublicidadTotal = inversionEnCampana + comisionAgenciaPublicidad;
    const inversionPublicidadTotalEnMonedaLocal = convertir(inversionPublicidadTotal, monedaInversion, monedaPais);

    // --- Gastos Operativos ---
    const shopify = parseFloat(gastosOperativos.shopify) || 0;
    const otrosGastos = parseFloat(gastosOperativos.otros) || 0;
    let gastosTarjetasTotal = 0;
    gastosOperativos.tarjetasDropi.forEach(t => {
      const montoTarjeta = parseFloat(t.monto) || 0;
      gastosTarjetasTotal += convertir(montoTarjeta, t.moneda, monedaPais);
    });
    const gastosOperativosTotal = convertir(shopify, 'USD', monedaPais) + otrosGastos + gastosTarjetasTotal;

    // --- Cálculos de Profit ---
    const facturacion = datos.facturacion || 0;
    const costoProductos = datos.costoProductos || 0;
    const costoEnvioTotal = datos.costoEnvioTotal || 0;
    const costoDevolucionFleteTotal = datos.costoDevolucionFleteTotal || 0;
    
    const comisionAgenciaFacturacion = importacion.pais === 'colombia' ? facturacion * 0.10 : 0;

    const costos = costoProductos + costoEnvioTotal + costoDevolucionFleteTotal;
    const profitOperativo = facturacion - costos;

    const beneficioGastos = facturacion - costoProductos - costoEnvioTotal;
    const beneficioPosibleDev = beneficioGastos - costoDevolucionFleteTotal;

    const profitFinal = profitOperativo - inversionPublicidadTotalEnMonedaLocal - gastosOperativosTotal - comisionAgenciaFacturacion;
    
    const gastosAdsOperativos = inversionPublicidadTotalEnMonedaLocal + gastosOperativosTotal;
    const roi = gastosAdsOperativos > 0 ? (profitFinal / gastosAdsOperativos) * 100 : 0;
    const cpaReal = datos.total > 0 ? inversionPublicidadTotalEnMonedaLocal / datos.total : 0;

    return {
      ...datos, facturacion, costos, profitOperativo,
      profitFinal, 
      inversionPublicidadTotal: inversionPublicidadTotalEnMonedaLocal, 
      gastosOperativosTotal,
      pais: importacion.pais, 
      cpaReal, roi,
      agencia: agencia.nombre,
      comisionPorcentaje: agencia.comision,
      inversionMoneda: monedaInversion,
      inversionEnCampana: inversionEnCampana,
      comisionAgenciaPublicidad: comisionAgenciaPublicidad,
      beneficioGastos,
      beneficioPosibleDev,
      comisionAgenciaFacturacion,
    };
}, [historico, inversionData, gastosOperativos]);

  const pais = PAISES[paisSel];
  const prodsPais = productos.filter(p => p.pais === paisSel);
  const metricas = calcular();
  const profitData = importacionActiva ? calcProfit(importacionActiva) : null;

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans pb-10">
      <header className="sticky top-0 z-50 bg-gray-900/80 backdrop-blur-lg border-b border-yellow-500/20 shadow-black/50 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-200 bg-clip-text text-transparent">
              Coinnecta Pro
            </h1>
            <p className="text-xs text-gray-400">Calculadora Dropshipping Profesional</p>
          </div>
          
          <div className="relative">
            <button onClick={() => setShowPaisMenu(!showPaisMenu)} className="flex items-center gap-2 px-4 py-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg cursor-pointer text-white text-sm font-bold hover:bg-yellow-500/20 transition-colors">
              <span className="text-2xl">{pais.flag}</span>
              <span>{pais.nombre}</span>
              <ChevronDown size={16} />
            </button>
            
            {showPaisMenu && (
              <div className="absolute top-full right-0 mt-2 bg-gray-800 border border-yellow-500/30 rounded-xl min-w-[200px] shadow-2xl z-10 overflow-hidden">
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
        <div className="grid grid-cols-3 gap-2 md:gap-4 mb-6">
          {[
            { id: 'calcular', icon: Calculator, label: 'Productos', color: 'yellow' },
            { id: 'importar', icon: Upload, label: 'Importar', color: 'blue' },
            { id: 'resultados', icon: DollarSign, label: 'Resultados', color: 'green' },
          ].map(tab => {
            const isActive = activeTab === tab.id;
            return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} 
                className={`p-3 md:p-4 font-bold rounded-xl cursor-pointer flex flex-col items-center justify-center gap-2 text-xs md:text-sm transition-all duration-300 transform
                ${isActive 
                    ? `bg-gradient-to-br from-${tab.color}-500 to-${tab.color}-600 text-white shadow-lg scale-105 border-2 border-white/50`
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700'}`
                }>
                <tab.icon size={24} />
                <span>{tab.label}</span>
                </button>
            )
          })}
        </div>

        {feedbackMsg && (
          <div className={`p-4 mb-4 rounded-lg font-bold text-center ${feedbackMsg.type === 'success' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
            {feedbackMsg.text}
          </div>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {activeTab === 'calcular' && (
            <>
              {/* Calculator Form Column */}
              <div className="space-y-6">
                 {/* Calculator form */}
                 <div className="bg-gray-800 p-6 rounded-2xl border border-yellow-500/30">
                    <h2 className="text-xl font-bold mb-5 text-yellow-400 flex items-center gap-2">
                      {editId ? <Edit size={22} /> : <Plus size={22} />} {editId ? 'Editar Producto' : 'Calcular Producto'}
                    </h2>
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
                        <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg flex justify-between items-center">
                            <div>
                                <div className="text-sm font-bold text-gray-300">📊 ¿Añadir IVA al coste? ({pais.iva}%)</div>
                                <div className="text-xs text-gray-400 mt-1">Activa si el proveedor cobra IVA</div>
                            </div>
                            <button onClick={() => setIncluirIva(!incluirIva)} className={`p-1 w-14 rounded-full transition-colors duration-300 ${incluirIva ? 'bg-green-500' : 'bg-gray-600'}`}>
                                <span className={`block w-6 h-6 rounded-full bg-white transform transition-transform duration-300 ${incluirIva ? 'translate-x-6' : ''}`}></span>
                            </button>
                        </div>
                        {/* CPA and Rates */}
                        <div className="bg-blue-500/10 p-4 rounded-lg border border-blue-500/30 space-y-4">
                            <h3 className="text-sm font-bold text-blue-300">⚙️ Tasas COD Esperadas</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs mb-2 block text-gray-300 font-bold">📞 Confirman: <span className="text-yellow-400">{tasas.conf}%</span></label>
                                    <input type="range" min="1" max="100" value={tasas.conf} onChange={(e) => setTasas({ ...tasas, conf: parseInt(e.target.value) })} className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-yellow-500" />
                                </div>
                                <div>
                                    <label className="text-xs mb-2 block text-gray-300 font-bold">✅ Entregan: <span className="text-yellow-400">{tasas.entr}%</span></label>
                                    <input type="range" min="1" max="100" value={tasas.entr} onChange={(e) => setTasas({ ...tasas, entr: parseInt(e.target.value) })} className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-yellow-500" />
                                </div>
                            </div>
                            <div className="mt-2 p-2 bg-yellow-500/10 rounded-md text-center">
                                <span className="text-xs text-gray-300">📊 Tasa Final Esperada: </span>
                                <strong className="text-yellow-400 font-bold">{(tasas.conf * tasas.entr / 100).toFixed(1)}%</strong>
                            </div>
                        </div>
                         {/* CPA Medio */}
                        <div className="bg-purple-500/10 p-4 rounded-lg border border-purple-500/30 space-y-4">
                            <h3 className="text-sm font-bold text-purple-300">🎯 CPA Medio de Campaña</h3>
                             <div>
                               <label className="block text-xs font-bold mb-2 text-gray-300">Moneda:</label>
                                <div className="flex gap-2">
                                    {['USD', 'EUR'].map(m => (
                                    <button key={m} onClick={() => setCpaMedio({ ...cpaMedio, moneda: m })} 
                                        className={`flex-1 py-2 rounded-md font-bold text-sm transition ${cpaMedio.moneda === m ? 'bg-purple-500 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>
                                        {m}
                                    </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold mb-2 text-gray-300">CPA que estás pagando:</label>
                                <input type="number" value={cpaMedio.valor} onChange={(e) => setCpaMedio({ ...cpaMedio, valor: e.target.value })} 
                                className="w-full p-3 text-xl font-bold rounded-lg border-2 border-purple-500/50 outline-none text-center bg-gray-700 text-white focus:ring-2 focus:ring-purple-500" placeholder="0.00" />
                                <p className="mt-2 text-xs text-gray-400 text-center">Ingresa tu CPA real de publicidad (en {cpaMedio.moneda})</p>
                            </div>
                        </div>
                     </div>
                 </div>
                 {/* ... Results column ... */}
                 {metricas && (
                   <div className="bg-gray-800 p-6 rounded-2xl border border-yellow-500/30">
                     <h3 className="text-lg font-bold mb-4 text-yellow-400">💰 PROFIT POR PEDIDO ENTREGADO</h3>
                      <div className="space-y-4">
                            <div className="p-3 bg-blue-500/10 rounded-lg border-2 border-blue-500/40 flex justify-between items-center">
                              <span className="text-xs font-bold text-blue-200">Beneficio bruto esperado:</span>
                              <span className="text-lg font-bold text-blue-300">{pais.simbolo}{fmt(metricas.beneficioEspCOD)}</span>
                            </div>

                            {cpaMedio.valor && parseFloat(cpaMedio.valor) > 0 ? (
                              (() => {
                                const cpaEnMonedaLocal = convertir(parseFloat(cpaMedio.valor), cpaMedio.moneda, pais.moneda);
                                const pvp = parseFloat(form.pvp) || 0;
                                const comisionAgencia = paisSel === 'colombia' ? pvp * 0.10 : 0;
                                const profitConCPA = metricas.beneficioEspCOD - cpaEnMonedaLocal - comisionAgencia;
                                return (
                                  <>
                                    <div className="p-3 bg-purple-500/10 rounded-lg border border-purple-500/30 flex justify-between items-center">
                                      <div className="text-xs font-bold text-purple-200">Tu CPA Real ({cpaMedio.valor} {cpaMedio.moneda})</div>
                                      <div className="text-xl font-bold text-purple-300">-{pais.simbolo}{fmt(cpaEnMonedaLocal)}</div>
                                    </div>
                                    {paisSel === 'colombia' && (
                                      <div className="p-3 bg-red-500/10 rounded-lg border border-red-500/30 flex justify-between items-center">
                                        <div className="text-xs font-bold text-red-200">Comisión Agencia (10% PVP)</div>
                                        <div className="text-xl font-bold text-red-300">-{pais.simbolo}{fmt(comisionAgencia)}</div>
                                      </div>
                                    )}
                                    <div className={`p-4 rounded-xl text-center border-2 ${profitConCPA >= 0 ? 'bg-green-500/20 border-green-500/60' : 'bg-red-500/20 border-red-500/60'}`}>
                                      <p className="text-xs font-bold text-gray-400 uppercase">🎯 PROFIT FINAL REAL/PEDIDO</p>
                                      <p className={`my-2 text-4xl font-bold ${profitConCPA >= 0 ? 'text-green-400' : 'text-red-400'}`}>{pais.simbolo}{fmt(profitConCPA)}</p>
                                      <p className="text-sm text-gray-400">${fmtDec(convertir(profitConCPA, pais.moneda, 'USD'))} USD</p>
                                    </div>
                                    {profitConCPA < 0 && <div className="mt-2 p-2 bg-red-500/20 rounded-md text-center text-xs text-red-300 font-bold">⚠️ Producto NO RENTABLE con este CPA</div>}
                                  </>
                                );
                              })()
                            ) : (
                              <div className="p-3 bg-yellow-500/10 rounded-lg text-center text-xs text-yellow-300">
                                💡 Ingresa tu CPA arriba para ver el profit final real
                              </div>
                            )}

                             {/* Scenarios */}
                            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-700">
                              <div className="bg-blue-500/20 p-4 rounded-lg text-center">
                                <p className="text-xs text-gray-400">🧪 Testeo (CPA 8%)</p>
                                <p className={`my-1 text-2xl font-bold ${metricas.profitTesteo >= 0 ? 'text-green-400' : 'text-red-400'}`}>{pais.simbolo}{fmt(metricas.profitTesteo)}</p>
                                <p className="text-xs text-gray-400">${fmtDec(convertir(metricas.profitTesteo, pais.moneda, 'USD'))} USD</p>
                              </div>
                              <div className="bg-green-500/20 p-4 rounded-lg text-center border-2 border-green-500/50">
                                <p className="text-xs text-gray-400">📈 Escala (CPA 11%)</p>
                                <p className={`my-1 text-2xl font-bold ${metricas.profitEscala >= 0 ? 'text-green-400' : 'text-red-400'}`}>{pais.simbolo}{fmt(metricas.profitEscala)}</p>
                                <p className="text-xs text-gray-400">${fmtDec(convertir(metricas.profitEscala, pais.moneda, 'USD'))} USD</p>
                              </div>
                            </div>
                          </div>
                   </div>
                 )}
                 {/* Submit button */}
                 <div className="flex gap-2 mt-6">
                    {editId && (
                      <button onClick={() => { setEditId(null); setForm({ nombre: '', pvp: '', coste: '', envio: '', cpaObj: '' }); }} className="flex-1 py-3 px-4 bg-gray-600 hover:bg-gray-500 text-white font-bold rounded-lg transition">Cancelar</button>
                    )}
                    <button onClick={handleSubmit} className="flex-1 py-3 px-4 bg-gradient-to-br from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black font-bold rounded-lg transition flex items-center justify-center gap-2">
                      <Plus size={20} /> {editId ? 'Actualizar Producto' : 'Guardar Producto'}
                    </button>
                </div>
              </div>

              {/* Saved Products Column */}
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
                      {prodsPais.map(p => {
                        const profitEscala = p.profitEscala;
                        return (
                          <div key={p.id} className="bg-gray-900/50 p-4 rounded-lg flex justify-between items-center gap-4">
                            <div className="flex-1">
                              <h4 className="font-bold text-white">{p.nombre}</h4>
                              <p className="text-xs text-gray-400 mt-1">
                                PVP: {pais.simbolo}{fmt(p.pvp)} • Coste Total: {pais.simbolo}{fmt(p.costeConIva + p.envio)}
                              </p>
                              <p className={`mt-1 text-sm font-bold ${profitEscala >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                Profit Escala: {pais.simbolo}{fmt(profitEscala)}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <button onClick={() => handleEdit(p)} className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-md transition"><Edit size={16} /></button>
                              <button onClick={() => handleDelete(p.id)} className="p-2 bg-red-600 hover:bg-red-500 text-white rounded-md transition"><Trash2 size={16} /></button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
              </div>
            </>
          )}

           {activeTab === 'importar' && (
              <>
                <div className="space-y-6">
                  {/* Investment */}
                    <div className="bg-gray-800 p-6 rounded-2xl border border-yellow-500/30">
                        <h2 className="text-xl font-bold mb-5 text-yellow-400 flex items-center gap-2"><DollarSign size={22}/>Inversión Publicitaria</h2>
                        <div className="space-y-4">
                           <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold mb-2 text-gray-300">Agencia:</label>
                                    <select value={inversionData.agencia} onChange={(e) => setInversionData({ ...inversionData, agencia: e.target.value })} className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg">
                                        {Object.entries(AGENCIAS).map(([key, a]) => (<option key={key} value={key}>{a.nombre}</option>))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold mb-2 text-gray-300">Moneda Inversión:</label>
                                    <select value={inversionData.moneda} onChange={(e) => setInversionData({ ...inversionData, moneda: e.target.value })} className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg">
                                        <option value="USD">USD</option>
                                        <option value="EUR">EUR</option>
                                        <option value={pais.moneda}>{pais.moneda}</option>
                                    </select>
                                </div>
                           </div>
                            <div>
                                <label className="block text-sm font-bold mb-2 text-gray-300">Monto Invertido ({inversionData.moneda}):</label>
                                <input type="number" value={inversionData.monto} onChange={(e) => setInversionData({ ...inversionData, monto: e.target.value })} className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg" placeholder="1000" />
                                {inversionData.agencia !== 'ninguna' && (
                                    <p className="text-xs text-gray-400 mt-2">Se añadirá un {AGENCIAS[inversionData.agencia]?.comision}% de comisión de agencia.</p>
                                )}
                            </div>
                        </div>
                    </div>
                  {/* Expenses */}
                  <div className="bg-gray-800 p-6 rounded-2xl border border-purple-500/30">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-purple-400 flex items-center gap-2"><Wallet size={22}/>Gastos Operativos</h2>
                        <button onClick={() => setMostrarGastos(!mostrarGastos)} className="px-3 py-1 text-xs font-bold bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded-full">{mostrarGastos ? 'Ocultar' : 'Mostrar'}</button>
                    </div>
                    {mostrarGastos && (
                        <div className="space-y-4">
                          <div>
                            <label className="flex items-center gap-2 text-sm font-bold mb-2 text-gray-300"><ShoppingCart size={16}/>Shopify (USD):</label>
                            <input type="number" value={gastosOperativos.shopify} onChange={(e) => setGastosOperativos({ ...gastosOperativos, shopify: e.target.value })} className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg" placeholder="29.00" />
                          </div>
                          <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="flex items-center gap-2 text-sm font-bold text-gray-300"><CreditCard size={16}/>Tarjetas DROPI:</label>
                                <button onClick={agregarTarjeta} className="px-2 py-1 text-xs font-bold bg-green-500/20 hover:bg-green-500/30 text-green-300 rounded-md flex items-center gap-1"><Plus size={14}/>Agregar</button>
                            </div>
                            <div className="space-y-2">
                               {gastosOperativos.tarjetasDropi.map(tarjeta => (
                                <div key={tarjeta.id} className="grid grid-cols-[2fr,1fr,1fr,auto] gap-2 items-center">
                                    <input type="text" value={tarjeta.nombre} onChange={(e) => actualizarTarjeta(tarjeta.id, 'nombre', e.target.value)} placeholder="Nombre tarjeta" className="p-2 text-sm bg-gray-700 border border-gray-600 rounded-lg" />
                                    <input type="number" value={tarjeta.monto} onChange={(e) => actualizarTarjeta(tarjeta.id, 'monto', e.target.value)} placeholder="Monto" className="p-2 text-sm bg-gray-700 border border-gray-600 rounded-lg" />
                                    <select value={tarjeta.moneda} onChange={(e) => actualizarTarjeta(tarjeta.id, 'moneda', e.target.value as keyof TarjetaDropi)} className="p-2 text-sm bg-gray-700 border border-gray-600 rounded-lg">
                                        <option value="COP">COP</option><option value="USD">USD</option><option value="EUR">EUR</option><option value="MXN">MXN</option>
                                    </select>
                                    <button onClick={() => eliminarTarjeta(tarjeta.id)} className="p-2 bg-red-600/50 hover:bg-red-600 text-white rounded-md"><Trash2 size={14}/></button>
                                </div>
                               ))}
                            </div>
                          </div>
                          <div>
                            <label className="text-sm font-bold mb-2 text-gray-300">Otros gastos ({pais.moneda}):</label>
                            <input type="number" value={gastosOperativos.otros} onChange={(e) => setGastosOperativos({ ...gastosOperativos, otros: e.target.value })} className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg" placeholder="0.00" />
                          </div>
                        </div>
                    )}
                  </div>
                </div>

                {/* File Upload Column */}
                <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700">
                    <h2 className="text-xl font-bold mb-2 text-gray-300">📤 Importar Excel de Pedidos</h2>
                    <p className="text-sm text-gray-400 mb-6">Sube tu archivo Excel con el reporte de órdenes.</p>
                     <div className="bg-gray-900/50 p-6 rounded-xl border-2 border-dashed border-gray-600 text-center">
                        <Upload size={40} className="mx-auto text-gray-500 mb-4" />
                        <label htmlFor="file-upload" className="relative cursor-pointer bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-2 px-4 rounded-lg transition-colors">
                            <span>{cargando ? 'Procesando...' : 'Seleccionar archivo'}</span>
                        </label>
                        <input id="file-upload" name="file-upload" type="file" className="sr-only" accept=".xlsx,.xls" onChange={handleFileUpload} disabled={cargando} />
                        <p className="mt-4 text-xs text-gray-500">Soporta archivos .xlsx y .xls</p>
                    </div>

                    {historico.length > 0 && (
                      <div className="mt-6">
                        <h3 className="text-lg font-bold mb-4 text-gray-300">📋 Histórico de Importaciones</h3>
                        <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                           {historico.map(h => (
                                <div key={h.id} className="bg-gray-900/50 p-3 rounded-lg flex justify-between items-center gap-4">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xl">{PAISES[h.pais].flag}</span>
                                            <h4 className="font-bold text-sm text-yellow-400 truncate">{h.archivo}</h4>
                                        </div>
                                        <p className="text-xs text-gray-400 mt-1">
                                            {h.fecha} • {h.datos.total} pedidos • {h.datos.entregados} entregados
                                        </p>
                                    </div>
                                    <button onClick={() => verResultados(h.id)} className="px-3 py-2 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg transition flex items-center gap-1.5 text-xs"><Eye size={14}/>Ver</button>
                                </div>
                            ))}
                        </div>
                      </div>
                    )}
                </div>
              </>
            )}

            {activeTab === 'resultados' && (
              <>
               {!profitData ? (
                  <div className="lg:col-span-2 bg-gray-800 p-10 rounded-2xl border border-yellow-500/30 text-center">
                    <AlertCircle size={48} className="mx-auto mb-4 text-yellow-500" />
                    <h3 className="text-xl font-bold text-white">Sin datos para mostrar</h3>
                    <p className="text-gray-400 mt-2 mb-6">Importa un Excel o selecciona uno del histórico para ver tus resultados.</p>
                    <button onClick={() => setActiveTab('importar')} className="py-2 px-5 bg-yellow-500 hover:bg-yellow-600 text-black font-bold rounded-lg transition">Ir a Importar</button>
                  </div>
                ) : (
                <div className="lg:col-span-2">
                  <div className="grid grid-cols-12 gap-4">
                    
                    {/* Left Column */}
                    <div className="col-span-12 md:col-span-3 space-y-4">
                        <div className="bg-black text-white p-4 rounded-lg shadow-lg border-2 border-gray-600">
                          <h4 className="font-bold text-center text-sm uppercase tracking-wider">Inversión Publicitaria</h4>
                          <p className="text-center text-2xl font-bold mt-2">{PAISES[profitData.pais].simbolo}{fmt(profitData.inversionPublicidadTotal)}</p>
                        </div>
                        {([
                            {label: 'Pedidos Totales', value: profitData.total, percent: 100},
                            {label: 'Rechazados', value: profitData.rechazados, percent: (profitData.rechazados / profitData.total) * 100},
                            {label: 'No Confirmables', value: profitData.noConfirmables, percent: (profitData.noConfirmables / profitData.total) * 100},
                            {label: 'Reclame en Oficina', value: profitData.reclameOficina, percent: (profitData.reclameOficina / profitData.total) * 100},
                            {label: 'Envíos en Ruta', value: profitData.enRuta, percent: (profitData.enviados / profitData.enviados) * 100},
                            {label: 'Novedades', value: profitData.novedades, percent: (profitData.novedades / profitData.enviados) * 100},
                            {label: 'Enviados', value: profitData.enviados, percent: (profitData.enviados / profitData.total) * 100},
                            {label: 'Entregados', value: profitData.entregados, percent: (profitData.entregados / profitData.enviados) * 100},
                        ]).map(item => (
                            <div key={item.label} className="bg-yellow-300 text-black p-2 rounded-lg shadow-md">
                              <h4 className="font-bold text-center text-xs uppercase">{item.label}</h4>
                              <div className="flex border-t border-black/20 mt-1 pt-1">
                                <div className="w-1/2 text-center">
                                  <p className="font-bold text-xs">Nº</p>
                                  <p className="font-bold text-lg">{fmt(item.value)}</p>
                                </div>
                                <div className="w-1/2 text-center border-l border-black/20">
                                  <p className="font-bold text-xs">%</p>
                                  <p className="font-bold text-lg">{fmtDec(item.percent)}%</p>
                                </div>
                              </div>
                            </div>
                        ))}
                    </div>

                    {/* Right Column */}
                    <div className="col-span-12 md:col-span-9 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="bg-orange-400 text-black p-3 rounded-lg shadow-lg">
                            <h4 className="font-bold text-center text-sm uppercase">Novedades</h4>
                            <div className="mt-2 space-y-1 text-xs font-bold bg-orange-200/50 p-2 rounded">
                               <div className="flex justify-between"><span>Nº NOVEDADES:</span><span>{fmt(profitData.novedades)}</span></div>
                               <div className="flex justify-between"><span>FACTURACIÓN INCIDENCIA:</span><span>{PAISES[profitData.pais].simbolo}{fmt(profitData.facturacionIncidencia)}</span></div>
                               <div className="flex justify-between"><span>ENVÍO DE LA INCIDENCIA:</span><span>{PAISES[profitData.pais].simbolo}0</span></div>
                               <div className="flex justify-between"><span>POSIBLE COSTO A DEVOLVER:</span><span>{PAISES[profitData.pais].simbolo}0</span></div>
                            </div>
                          </div>
                          <div className="bg-yellow-500 text-black p-3 rounded-lg shadow-lg">
                            <h4 className="font-bold text-center text-sm uppercase">Rehusados</h4>
                            <div className="mt-2 space-y-1 text-xs font-bold bg-yellow-200/50 p-2 rounded">
                               <div className="flex justify-between"><span>Nº REHUSADOS EN TRÁNSITO:</span><span>{fmt(profitData.rehusadosTransito)}</span></div>
                               <div className="flex justify-between"><span>REHUSADOS RECEPCIONADOS:</span><span>{fmt(profitData.rehusadosRecepcionados)}</span></div>
                               <div className="flex justify-between"><span>COSTO DEL ENVÍO:</span><span>{PAISES[profitData.pais].simbolo}0</span></div>
                               <div className="flex justify-between"><span>COSTO DE LA DEVOLUCIÓN:</span><span>{PAISES[profitData.pais].simbolo}{fmt(profitData.costoDevolucionFleteTotal)}</span></div>
                            </div>
                          </div>
                          <div className="bg-lime-300 text-black p-3 rounded-lg shadow-lg">
                            <h4 className="font-bold text-center text-sm uppercase">Entregados</h4>
                            <div className="mt-2 space-y-1 text-xs font-bold bg-lime-100/50 p-2 rounded">
                               <div className="flex justify-between"><span>Nº ENTREGADOS:</span><span>{fmt(profitData.entregados)}</span></div>
                               <div className="flex justify-between"><span>FACTURACIÓN:</span><span>{PAISES[profitData.pais].simbolo}{fmt(profitData.facturacion)}</span></div>
                               <div className="flex justify-between"><span>COSTO PRODUCTOS:</span><span>{PAISES[profitData.pais].simbolo}{fmt(profitData.costoProductos)}</span></div>
                               <div className="flex justify-between border-t-2 border-yellow-600 mt-1 pt-1"><span>COSTO DEL ENVÍO (TOTAL):</span><span>{PAISES[profitData.pais].simbolo}{fmt(profitData.costoEnvioTotal)}</span></div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-rose-500 text-white p-2 rounded-lg text-center shadow-lg"><h5 className="text-xs font-bold">BENEFICIO - GASTOS</h5><p className="font-bold text-xl">{PAISES[profitData.pais].simbolo}{fmt(profitData.beneficioGastos)}</p></div>
                            <div className="bg-rose-500 text-white p-2 rounded-lg text-center shadow-lg"><h5 className="text-xs font-bold">BENEFICIO - POSIBLE DEV</h5><p className="font-bold text-xl">{PAISES[profitData.pais].simbolo}{fmt(profitData.beneficioPosibleDev)}</p></div>
                            <div className="bg-black text-lime-400 p-2 rounded-lg text-center shadow-lg border-2 border-lime-400"><h5 className="text-xs font-bold text-white">PROFIT</h5><p className="font-bold text-xl">{PAISES[profitData.pais].simbolo}{fmt(profitData.profitFinal)}</p></div>
                        </div>

                        {/* Charts */}
                        <div className="bg-gray-800 p-4 rounded-lg mt-4 border border-gray-700">
                           <h3 className="font-bold text-center text-white mb-4">COSTO - BENEFICIO</h3>
                           <div className="w-full h-64 flex justify-around items-end gap-2 text-white text-xs text-center">
                                {[
                                    {label: 'FACTURACIÓN', value: profitData.facturacion, color: 'bg-green-500'},
                                    {label: 'INVERSIÓN', value: profitData.inversionPublicidadTotal, color: 'bg-purple-500'},
                                    {label: 'PRODUCTOS', value: profitData.costoProductos, color: 'bg-red-600'},
                                    {label: 'ENVÍO', value: profitData.costoEnvioTotal, color: 'bg-blue-500'},
                                    {label: 'FLETE DEV', value: profitData.costoDevolucionFleteTotal, color: 'bg-red-800'},
                                    ...(profitData.comisionAgenciaFacturacion && profitData.comisionAgenciaFacturacion > 0 ?
                                        [{label: 'AGENCIA 10%', value: profitData.comisionAgenciaFacturacion, color: 'bg-orange-500'}] :
                                        []
                                    ),
                                    ...(profitData.gastosOperativosTotal > 0 ?
                                        [{label: 'GASTOS OP.', value: profitData.gastosOperativosTotal, color: 'bg-pink-500'}] :
                                        []
                                    )
                                ].map(bar => {
                                    const maxVal = Math.max(profitData.facturacion, 1);
                                    const height = (bar.value / maxVal) * 90;
                                    return (
                                    <div key={bar.label} className="h-full flex flex-col justify-end items-center flex-1">
                                        <p className="font-bold text-lime-300 text-[10px]">{PAISES[profitData.pais].simbolo}{fmt(bar.value)}</p>
                                        <div className={`${bar.color} w-4/5 rounded-t-sm border-2 border-black/30 relative`} style={{height: `${height}%`}}>
                                          <div className="absolute -top-1 left-0 w-full h-2 bg-white/20 rounded-t-sm"></div>
                                        </div>
                                        <p className="mt-1 font-bold text-[10px] uppercase">{bar.label}</p>
                                    </div>
                                    )
                                })}
                           </div>

                           <div className="grid grid-cols-2 gap-8 mt-8 items-center">
                                <div>
                                    <h3 className="font-bold text-center text-white mb-2">PEDIDOS</h3>
                                    <div className="relative flex justify-center items-center">
                                       {(() => {
                                         const pcts = {
                                           enviados: (profitData.enviados / profitData.total) * 100,
                                           rechazados: (profitData.rechazados / profitData.total) * 100,
                                           cancelados: (profitData.cancelados / profitData.total) * 100,
                                           otros: (profitData.reclameOficina / profitData.total) * 100,
                                         };
                                         const gradient = `conic-gradient(
                                            #a3e635 0% ${pcts.enviados}%,
                                            #f87171 ${pcts.enviados}% ${pcts.enviados + pcts.rechazados}%,
                                            #fb923c ${pcts.enviados + pcts.rechazados}% ${pcts.enviados + pcts.rechazados + pcts.cancelados}%,
                                            #60a5fa 0
                                         )`;
                                         return (
                                          <>
                                            <div className="w-40 h-40 rounded-full" style={{background: gradient}}></div>
                                            <div className="absolute text-center">
                                                <p className="font-bold text-2xl">{fmt(profitData.enviados)}</p>
                                                <p className="text-xs uppercase">Enviados</p>
                                            </div>
                                          </>
                                         );
                                       })()}
                                    </div>
                                </div>
                                <div className="space-y-4">
                                     <h3 className="font-bold text-center text-white mb-2">PROFIT ACTUAL</h3>
                                     <div className="w-full bg-gray-700 rounded-full h-8 border-2 border-gray-600">
                                       <div className="bg-lime-400 h-full rounded-full flex items-center justify-center" style={{width: `100%`}}>
                                            <span className="font-bold text-black text-sm">{PAISES[profitData.pais].simbolo}{fmt(profitData.profitFinal)}</span>
                                       </div>
                                     </div>
                                </div>
                           </div>
                        </div>
                    </div>

                  </div>
                 </div>
                )}
              </>
            )}
        </div>
      </main>
    </div>
  );
}
