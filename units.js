// Einheiten-Rechner
(function(){
  const UNITS = {
    'Länge': {base:'m', items:{
      'Millimeter (mm)':0.001,'Zentimeter (cm)':0.01,'Dezimeter (dm)':0.1,'Meter (m)':1,'Kilometer (km)':1000,
      'Inch (in)':0.0254,'Fuß (ft)':0.3048,'Yard (yd)':0.9144,'Meile (mi)':1609.344,'Seemeile (nmi)':1852,
      'Lichtjahr (ly)':9.461e15,'Astron. Einheit (AU)':1.496e11,'Parsec (pc)':3.086e16
    }},
    'Masse': {base:'kg', items:{
      'Milligramm (mg)':1e-6,'Gramm (g)':0.001,'Kilogramm (kg)':1,'Tonne (t)':1000,
      'Unze (oz)':0.0283495,'Pfund (lb)':0.453592,'Stein (st)':6.35029,'Karat (ct)':0.0002
    }},
    'Zeit': {base:'s', items:{
      'Millisekunde (ms)':0.001,'Sekunde (s)':1,'Minute (min)':60,'Stunde (h)':3600,
      'Tag (d)':86400,'Woche':604800,'Jahr (a)':31557600
    }},
    'Geschwindigkeit': {base:'m/s', items:{
      'm/s':1,'km/h':1/3.6,'mph':0.44704,'Knoten (kn)':0.51444,'ft/s':0.3048,'Mach (Luft)':343
    }},
    'Fläche': {base:'m²', items:{
      'mm²':1e-6,'cm²':1e-4,'m²':1,'Hektar (ha)':10000,'km²':1e6,'Acre':4046.86,'sqft':0.092903,'sqmi':2.59e6
    }},
    'Volumen': {base:'L', items:{
      'Milliliter (ml)':0.001,'Zentiliter (cl)':0.01,'Liter (L)':1,'Kubikmeter (m³)':1000,
      'US-Gallone':3.7854,'UK-Gallone':4.5461,'US-Pint':0.4732,'Barrel (Öl)':158.987,'Tasse (US)':0.2366
    }},
    'Temperatur': {base:'K', special:true, items:{
      'Celsius (°C)':{to:c=>c+273.15,from:k=>k-273.15},
      'Kelvin (K)':{to:k=>k,from:k=>k},
      'Fahrenheit (°F)':{to:f=>(f-32)*5/9+273.15,from:k=>(k-273.15)*9/5+32}
    }},
    'Energie': {base:'J', items:{
      'Joule (J)':1,'Kilojoule (kJ)':1000,'Kalorie (cal)':4.184,'Kilokalorie (kcal)':4184,
      'Wattstunde (Wh)':3600,'Kilowattstunde (kWh)':3.6e6,'Elektronvolt (eV)':1.602e-19,'BTU':1055.06
    }},
    'Leistung': {base:'W', items:{
      'Watt (W)':1,'Kilowatt (kW)':1000,'Megawatt (MW)':1e6,
      'PS (metrisch)':735.5,'HP (US)':745.7,'BTU/h':0.2931
    }},
    'Druck': {base:'Pa', items:{
      'Pascal (Pa)':1,'Hektopascal (hPa)':100,'Kilopascal (kPa)':1000,'Megapascal (MPa)':1e6,
      'Bar':1e5,'Millibar':100,'Atmosphäre (atm)':101325,'Torr':133.322,'psi':6894.76,'mmHg':133.322
    }},
    'Datenmenge': {base:'B', items:{
      'Bit (b)':0.125,'Byte (B)':1,'Kilobyte (KB)':1000,'Megabyte (MB)':1e6,'Gigabyte (GB)':1e9,'Terabyte (TB)':1e12,
      'Kibibyte (KiB)':1024,'Mebibyte (MiB)':1048576,'Gibibyte (GiB)':1073741824,'Tebibyte (TiB)':1.0995e12
    }},
    'Datenrate': {base:'bit/s', items:{
      'bit/s':1,'kbit/s':1000,'Mbit/s':1e6,'Gbit/s':1e9,
      'Byte/s':8,'KB/s':8000,'MB/s':8e6,'GB/s':8e9
    }},
    'Winkel': {base:'rad', items:{
      'Grad (°)':Math.PI/180,'Bogenmaß (rad)':1,'Gon (gon)':Math.PI/200,'Bogenminute':Math.PI/(180*60),'Bogensekunde':Math.PI/(180*3600)
    }},
    'Frequenz': {base:'Hz', items:{
      'Hertz (Hz)':1,'Kilohertz (kHz)':1000,'Megahertz (MHz)':1e6,'Gigahertz (GHz)':1e9,'rpm':1/60
    }},
    'Kraft': {base:'N', items:{
      'Newton (N)':1,'Kilonewton (kN)':1000,'Dyn':1e-5,'Pfund-Kraft (lbf)':4.448,'Kilopond (kp)':9.80665
    }},
    'Drehmoment': {base:'N·m', items:{'N·m':1,'kN·m':1000,'lbf·ft':1.3558,'lbf·in':0.11298,'kp·m':9.80665}},
    'Beleuchtungsstärke': {base:'lux', items:{'Lux':1,'Footcandle':10.764}},
    'Magnetfeld': {base:'T', items:{'Tesla (T)':1,'Gauß (G)':1e-4,'Milli-Tesla':0.001}},
    'Stromstärke': {base:'A', items:{'Ampere (A)':1,'Milliampere (mA)':0.001,'Mikroampere (µA)':1e-6,'Kiloampere (kA)':1000}},
    'Spannung': {base:'V', items:{'Volt (V)':1,'Millivolt (mV)':0.001,'Kilovolt (kV)':1000,'Megavolt (MV)':1e6}},
    'Widerstand': {base:'Ω', items:{'Ohm (Ω)':1,'Kiloohm (kΩ)':1000,'Megaohm (MΩ)':1e6,'Milliohm (mΩ)':0.001}},
    'Kapazität': {base:'F', items:{'Farad (F)':1,'Mikrofarad (µF)':1e-6,'Nanofarad (nF)':1e-9,'Picofarad (pF)':1e-12}},
    'Induktivität': {base:'H', items:{'Henry (H)':1,'Millihenry (mH)':0.001,'Mikrohenry (µH)':1e-6}},
    'Lichtgeschwindigkeit / div': {base:'m/s', items:{'m/s':1,'c (Vakuum)':299792458,'km/s':1000}},
    'Stoffmenge': {base:'mol', items:{'Mol (mol)':1,'Millimol (mmol)':0.001,'Kilomol (kmol)':1000}},
    'Radioaktivität': {base:'Bq', items:{'Becquerel (Bq)':1,'Curie (Ci)':3.7e10,'kBq':1000,'MBq':1e6}},
    'Strahlendosis': {base:'Sv', items:{'Sievert (Sv)':1,'Millisievert (mSv)':0.001,'Mikrosievert (µSv)':1e-6,'Rem':0.01}},
    'Kraftstoffverbrauch': {base:'L/100km', special:true, items:{
      'L/100km':{to:x=>x,from:x=>x},
      'mpg (US)':{to:x=>235.215/x,from:x=>235.215/x},
      'km/L':{to:x=>100/x,from:x=>100/x}
    }},
    'Währungen (fix 2026-05)': {base:'EUR', items:{
      'Euro (EUR)':1,'US-Dollar (USD)':1/1.08,'Brit. Pfund (GBP)':1/0.85,'Schweizer Franken (CHF)':1/0.97,
      'Japan. Yen (JPY)':1/165,'Chines. Yuan (CNY)':1/7.85,'Indische Rupie (INR)':1/91,
      'Brasil. Real (BRL)':1/5.6,'Russ. Rubel (RUB)':1/100,'Türkische Lira (TRY)':1/38,
      'Austral. Dollar (AUD)':1/1.65,'Kanad. Dollar (CAD)':1/1.48,'Süd-Koreanischer Won (KRW)':1/1450,
      'Südafrik. Rand (ZAR)':1/20,'Mexikan. Peso (MXN)':1/19,'Schwed. Krone (SEK)':1/11.5,
      'Norweg. Krone (NOK)':1/11.8,'Dänische Krone (DKK)':1/7.46,'Polnischer Zloty (PLN)':1/4.3,
      'Bitcoin (BTC)':1/65000,'Gold (Unze)':1/2200,'Silber (Unze)':1/27
    }}
  };

  const catEl=document.getElementById('unitCat');
  const fromEl=document.getElementById('unitFrom');
  const toEl=document.getElementById('unitTo');
  const fromVal=document.getElementById('unitFromVal');
  const toVal=document.getElementById('unitToVal');
  Object.keys(UNITS).forEach(c=>{const o=document.createElement('option');o.textContent=c;catEl.appendChild(o);});

  function fillUnits(){
    const cat=UNITS[catEl.value];
    fromEl.innerHTML='';toEl.innerHTML='';
    Object.keys(cat.items).forEach(u=>{
      fromEl.appendChild(new Option(u,u));toEl.appendChild(new Option(u,u));
    });
    toEl.selectedIndex=Math.min(1,toEl.options.length-1);
    convert();
  }
  function toBase(cat,unit,v){const it=cat.items[unit];return cat.special?it.to(v):v*it;}
  function fromBase(cat,unit,v){const it=cat.items[unit];return cat.special?it.from(v):v/it;}
  function convert(dir){
    const cat=UNITS[catEl.value];
    if(dir==='to'){const v=parseFloat(toVal.value);if(isNaN(v))return;const b=toBase(cat,toEl.value,v);fromVal.value=fmt(fromBase(cat,fromEl.value,b));}
    else{const v=parseFloat(fromVal.value);if(isNaN(v))return;const b=toBase(cat,fromEl.value,v);toVal.value=fmt(fromBase(cat,toEl.value,b));}
  }
  function fmt(n){if(!isFinite(n))return n;if(Math.abs(n)>=1e9||(Math.abs(n)<1e-4&&n!==0))return n.toExponential(6);return Math.round(n*1e6)/1e6;}

  catEl.onchange=fillUnits;
  [fromEl,toEl].forEach(e=>e.onchange=()=>convert());
  fromVal.oninput=()=>convert('from');
  toVal.oninput=()=>convert('to');
  document.getElementById('unitSwap').onclick=()=>{const a=fromEl.value,b=toEl.value;fromEl.value=b;toEl.value=a;convert('from');};
  fillUnits();
})();
