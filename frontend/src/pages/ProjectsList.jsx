import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { 
  Search, Filter, ArrowUpDown, Download, Building2, 
  ChevronRight, RefreshCw, AlertCircle, MapPin, Navigation, 
  Compass, Globe, Layers, CheckCircle2, Sliders, ExternalLink,
  ShieldCheck, HardHat, Mountain, LocateFixed, Radio, X, MapPinOff, Route, Info
} from 'lucide-react';
import RiskBadge from '../components/RiskBadge';
import { useLanguage } from '../context/LanguageContext';
import { 
  REGION_CENTROIDS, POPULAR_CITIES, calculateDistanceKm, getProjectCoordinates, findNearestHub, reverseGeocodeLive 
} from '../utils/geoUtils';

const QUICK_REGIONS = [
  'All Regions',
  'Uttar Pradesh',
  'Delhi NCR',
  'Maharashtra',
  'Gujarat',
  'Karnataka',
  'Tamil Nadu',
  'Madhya Pradesh',
  'Rajasthan',
  'Bihar',
  'West Bengal',
  'Assam',
  'Odisha',
  'Jharkhand'
];

export default function ProjectsList() {
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedRisk, setSelectedRisk] = useState('All');
  const [selectedRegion, setSelectedRegion] = useState(() => searchParams.get('region') || 'All Regions');
  const [sortBy, setSortBy] = useState('risk_desc');
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'grid'

  // Location / GPS states
  const [userCoords, setUserCoords] = useState(null);
  const [locationName, setLocationName] = useState('');
  const [locationSource, setLocationSource] = useState(null); // 'gps' | 'preset' | 'city'
  const [locationError, setLocationError] = useState(null);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [maxDistanceKm, setMaxDistanceKm] = useState('all');
  const [selectedCity, setSelectedCity] = useState('');

  useEffect(() => {
    fetchProjects();
  }, [selectedDept, selectedRisk]);

  // If URL has region parameter on initial mount, set the anchor
  useEffect(() => {
    const urlRegion = searchParams.get('region');
    if (urlRegion && REGION_CENTROIDS[urlRegion]) {
      setUserCoords({ lat: REGION_CENTROIDS[urlRegion].lat, lng: REGION_CENTROIDS[urlRegion].lng });
      setLocationName(REGION_CENTROIDS[urlRegion].name);
      setLocationSource('preset');
      setSelectedRegion(urlRegion);
      setSortBy('nearest');
    }
  }, [searchParams]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      let url = '/api/projects?';
      if (selectedDept !== 'All') url += `department=${encodeURIComponent(selectedDept)}&`;
      if (selectedRisk !== 'All') url += `risk_level=${encodeURIComponent(selectedRisk)}&`;
      
      const res = await axios.get(url);
      setProjects(res.data);
    } catch (err) {
      console.error("Failed to fetch projects:", err);
    } finally {
      setLoading(false);
    }
  };

  // ── GPS Location Detection ──
  const handleDetectLocation = () => {
    setDetectingLocation(true);
    setLocationError(null);

    // Check if browser supports geolocation
    if (!navigator.geolocation) {
      setLocationError('Your browser does not support GPS location. Please select your city from the dropdown below.');
      setDetectingLocation(false);
      return;
    }

    // Check if we are on a secure context (HTTPS or localhost)
    // Geolocation is blocked on plain HTTP (non-localhost)
    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      setLocationError('GPS requires HTTPS. You are on HTTP – please select your city from the dropdown, or access this site via localhost or HTTPS.');
      setDetectingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        console.log('GPS acquired:', lat, lng);

        // Try live reverse geocoding first for accurate city/state
        let label = '';
        try {
          const geoInfo = await reverseGeocodeLive(lat, lng);
          if (geoInfo && geoInfo.label) {
            label = `${geoInfo.label} (Live GPS)`;
          }
        } catch (e) {
          console.warn('Reverse geocode failed, using local DB:', e);
        }

        // Fallback to local nearest hub database
        if (!label) {
          const hub = findNearestHub(lat, lng);
          if (hub && hub.distanceKm <= 80) {
            label = `${hub.name}, ${hub.state} (Live GPS)`;
          } else if (hub) {
            label = `Near ${hub.name}, ${hub.state} (Live GPS)`;
          } else {
            label = `${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E (Live GPS)`;
          }
        }

        setUserCoords({ lat, lng });
        setLocationName(label);
        setLocationSource('gps');
        setSelectedRegion('Uttar Pradesh');
        setSelectedCity('');
        setSortBy('nearest');
        setDetectingLocation(false);
      },
      (err) => {
        console.error('GPS Error:', err.code, err.message);
        let msg = '';
        switch (err.code) {
          case 1: // PERMISSION_DENIED
            msg = 'GPS permission denied. Showing Uttar Pradesh projects directory.';
            break;
          case 2: // POSITION_UNAVAILABLE
            msg = 'GPS position unavailable on this device. Showing Uttar Pradesh projects directory.';
            break;
          case 3: // TIMEOUT
            msg = 'GPS timed out. Showing Uttar Pradesh projects directory.';
            break;
          default:
            msg = 'Could not get GPS location. Showing Uttar Pradesh projects directory.';
        }
        // Fallback to UP coordinates & filter
        setUserCoords({ lat: 26.8467, lng: 80.9462 });
        setLocationName('Uttar Pradesh (Central Anchor)');
        setLocationSource('preset');
        setSelectedRegion('Uttar Pradesh');
        setSortBy('nearest');
        setLocationError(msg);
        setDetectingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0  // Always get fresh position, never cache
      }
    );
  };

  // Select a preset region / state
  const handleSelectRegion = (region) => {
    setSelectedRegion(region);
    setSelectedCity('');
    setLocationError(null);

    if (region === 'All Regions') {
      setUserCoords(null);
      setLocationName('');
      setLocationSource(null);
      setMaxDistanceKm('all');
      if (sortBy === 'nearest' || sortBy === 'farthest') setSortBy('risk_desc');
    } else if (REGION_CENTROIDS[region]) {
      setUserCoords({ lat: REGION_CENTROIDS[region].lat, lng: REGION_CENTROIDS[region].lng });
      setLocationName(REGION_CENTROIDS[region].name);
      setLocationSource('preset');
      setSortBy('nearest');
    }
  };

  // Select a major city
  const handleSelectCity = (cityName) => {
    if (!cityName) return;
    const city = POPULAR_CITIES.find(c => c.name === cityName);
    if (city) {
      setUserCoords({ lat: city.lat, lng: city.lng });
      setLocationName(`${city.name}, ${city.state}`);
      setLocationSource('city');
      setSelectedCity(city.name);
      setSelectedRegion('All Regions');
      setLocationError(null);
      setSortBy('nearest');
    }
  };

  // Clear all location filters
  const handleClearLocation = () => {
    setUserCoords(null);
    setLocationName('');
    setLocationSource(null);
    setSelectedRegion('All Regions');
    setSelectedCity('');
    setLocationError(null);
    setMaxDistanceKm('all');
    setSortBy('risk_desc');
  };

  // Enrich projects with coordinates and distance
  const enrichedProjects = projects.map((p) => {
    const coords = getProjectCoordinates(p);
    let distanceKm = null;
    if (userCoords && coords) {
      distanceKm = calculateDistanceKm(userCoords.lat, userCoords.lng, coords.lat, coords.lng);
    }
    return { ...p, coords, distanceKm };
  });

  // Client-side filtering
  const filteredProjects = enrichedProjects.filter((p) => {
    // 1. Text search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const match = (
        p.name.toLowerCase().includes(term) ||
        p.project_code.toLowerCase().includes(term) ||
        (p.location && p.location.toLowerCase().includes(term)) ||
        (p.department && p.department.toLowerCase().includes(term)) ||
        (p.contractor && p.contractor.toLowerCase().includes(term)) ||
        (p.mybharat_district && p.mybharat_district.toLowerCase().includes(term)) ||
        (p.mybharat_state && p.mybharat_state.toLowerCase().includes(term))
      );
      if (!match) return false;
    }

    // 2. Region filter
    if (selectedRegion !== 'All Regions') {
      const reg = selectedRegion.toLowerCase();
      const matchRegion = (
        (p.mybharat_state && p.mybharat_state.toLowerCase().includes(reg)) ||
        (p.location && p.location.toLowerCase().includes(reg)) ||
        (p.mybharat_district && p.mybharat_district.toLowerCase().includes(reg))
      );
      if (!matchRegion) return false;
    }

    // 3. Max distance filter (if location anchor is set and radius is not 'all')
    if (userCoords && maxDistanceKm !== 'all') {
      if (p.distanceKm == null) return false;
      const maxDist = parseFloat(maxDistanceKm);
      if (p.distanceKm > maxDist) return false;
    }

    return true;
  }).sort((a, b) => {
    if (sortBy === 'nearest') {
      if (a.distanceKm == null && b.distanceKm == null) return 0;
      if (a.distanceKm == null) return 1;
      if (b.distanceKm == null) return -1;
      return a.distanceKm - b.distanceKm;
    }
    if (sortBy === 'farthest') {
      if (a.distanceKm == null && b.distanceKm == null) return 0;
      if (a.distanceKm == null) return 1;
      if (b.distanceKm == null) return -1;
      return b.distanceKm - a.distanceKm;
    }
    if (sortBy === 'risk_desc') return b.overall_risk_score - a.overall_risk_score;
    if (sortBy === 'risk_asc') return a.overall_risk_score - b.overall_risk_score;
    if (sortBy === 'budget_desc') return b.budget_cr - a.budget_cr;
    if (sortBy === 'progress_asc') return a.current_progress_pct - b.current_progress_pct;
    return 0;
  });

  const departments = ['All', 'Highways & Transport', 'Urban Transit', 'Water Resources', 'Renewable Energy', 'Healthcare', 'Energy & Power', 'Urban Development'];

  const allCities = POPULAR_CITIES;

  const exportTableCSV = () => {
    const headers = ["Project Code", "Name", "Department", "Location", "State", "District", "Distance Km", "Budget Cr", "Spent Cr", "Progress %", "Cost Risk %", "Schedule Risk %", "Overall Score", "Risk Level", "Predicted Delay Mos"];
    const rows = filteredProjects.map(p => [
      p.project_code,
      `"${p.name}"`,
      `"${p.department}"`,
      `"${p.location}"`,
      `"${p.mybharat_state || ''}"`,
      `"${p.mybharat_district || ''}"`,
      p.distanceKm != null ? p.distanceKm : "N/A",
      p.budget_cr,
      p.spent_cr,
      p.current_progress_pct,
      p.cost_risk_score,
      p.schedule_risk_score,
      p.overall_risk_score,
      p.overall_risk_level,
      p.predicted_delay_months
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `drishti_projects_directory.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* ── Top Header Strip ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 flex items-center gap-2">
            <Building2 className="w-6 h-6 text-blue-600" />
            <span>{t('projectsDirTitle', 'Monitored Projects & GIS Location Explorer')}</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {t('projectsDirSubtitle', 'Explore infrastructure works across India, filter by your live GPS position, city hub, or administrative state.')}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={exportTableCSV}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold transition-all shadow-xs"
          >
            <Download className="w-4 h-4 text-blue-600" />
            <span>{t('btnExportCsv', 'Export Directory CSV')}</span>
          </button>

          <button
            onClick={fetchProjects}
            className="p-2 rounded-xl bg-white hover:bg-slate-50 text-slate-500 border border-slate-200 transition-all shadow-xs"
            title="Refresh Directory"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Specific Place & Current Location (GPS) Strip ── */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-50/90 via-indigo-50/70 to-slate-50 border border-blue-200 shadow-xs space-y-4">
        
        {/* Main Controls Row */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Header & Status */}
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shrink-0">
              <Navigation className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-bold text-slate-800">
                  Location Telemetry & Proximity Explorer
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 border border-blue-200 flex items-center gap-1">
                  <Radio className="w-2.5 h-2.5 text-blue-600 animate-ping" />
                  GIS Proximity Engine
                </span>
                {userCoords && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                    locationSource === 'gps' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                    locationSource === 'city' ? 'bg-indigo-100 text-indigo-800 border border-indigo-200' :
                    locationSource === 'ip' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                    'bg-slate-100 text-slate-700 border border-slate-200'
                  }`}>
                    <LocateFixed className="w-2.5 h-2.5" />
                    {locationSource === 'gps' ? 'Live GPS Active' : locationSource === 'city' ? 'City Anchor' : locationSource === 'ip' ? 'Network Approx' : 'Regional Hub'}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                {locationName ? (
                  <span className="text-blue-700 font-semibold flex items-center gap-1 flex-wrap">
                    <MapPin className="w-3.5 h-3.5 text-rose-500 inline shrink-0" />
                    <span>Anchor: <strong>{locationName}</strong></span>
                    {userCoords && (
                      <span className="text-slate-400 font-mono text-[11px] ml-1">
                        ({userCoords.lat.toFixed(3)}°N, {userCoords.lng.toFixed(3)}°E)
                      </span>
                    )}
                  </span>
                ) : (
                  'Click "Use My GPS Location" or pick your city/state to calculate nearest public projects'
                )}
              </p>
            </div>
          </div>

          {/* Action Buttons: GPS Detector + City Selector + View Switcher */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">

            {/* GPS Detection Button */}
            <button
              onClick={handleDetectLocation}
              disabled={detectingLocation}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold shadow-sm transition-all active:scale-95 ${
                detectingLocation 
                  ? 'bg-blue-400 text-white cursor-wait' 
                  : userCoords && locationSource === 'gps'
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200'
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200'
              }`}
              title="Detect live GPS coordinates from your device"
            >
              {detectingLocation ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <LocateFixed className="w-4 h-4" />
              )}
              <span>{detectingLocation ? 'Detecting Your Location...' : userCoords && locationSource === 'gps' ? '✓ GPS Active — Re-detect' : 'Use My Current Location'}</span>
            </button>

            {/* City Selector Dropdown */}
            <div className="relative">
              <select
                value={selectedCity}
                onChange={(e) => handleSelectCity(e.target.value)}
                className="bg-white border border-blue-200 text-slate-700 text-xs font-semibold rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-xs cursor-pointer"
              >
                <option value="">📍 Or select your city...</option>
                {allCities.map(c => (
                  <option key={c.name} value={c.name}>{c.name} ({c.state})</option>
                ))}
              </select>
            </div>

            {/* View Mode Toggle */}
            <div className="flex bg-white rounded-xl border border-slate-200 p-0.5 text-xs font-semibold shadow-xs">
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  viewMode === 'table' ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Table
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 ${
                  viewMode === 'grid' ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Cards</span>
              </button>
            </div>

          </div>

        </div>

        {/* Informational Alert / Error Banner */}
        {locationError && (
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start justify-between gap-2">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>{locationError}</span>
            </div>
            <button
              onClick={() => setLocationError(null)}
              className="text-amber-700 hover:text-amber-900 font-bold text-xs p-1 shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Quick Place / State Selection Pills */}
        <div className="space-y-2 pt-2 border-t border-blue-200/60">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-blue-500" />
              <span>Quick State / Region Filter:</span>
            </span>
            {userCoords && (
              <button
                onClick={handleClearLocation}
                className="text-[11px] text-rose-600 hover:text-rose-800 font-bold flex items-center gap-1 hover:underline transition-colors"
              >
                <X className="w-3 h-3" />
                <span>Reset Location Anchor</span>
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5">
            {QUICK_REGIONS.map((region) => {
              const isSelected = selectedRegion === region;
              return (
                <button
                  key={region}
                  onClick={() => handleSelectRegion(region)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs font-bold'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                  }`}
                >
                  {region === 'All Regions' ? (
                    <>
                      <Globe className="w-3 h-3" />
                      <span>All India</span>
                    </>
                  ) : (
                    <>
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span>{region}</span>
                    </>
                  )}
                </button>
              );
            })}
          </div>
        </div>

      </div>

      {/* ── Search & Filter Bar ── */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        
        {/* Search Box */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={t('filterSearchProject', 'Search by project name, place/district, state, contractor, code...')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-colors"
          />
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-3">
          
          {/* Department Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Filter className="w-3.5 h-3.5" />
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-blue-400 font-medium"
            >
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d === 'All' ? t('filterDeptAll', 'All Departments') : d}
                </option>
              ))}
            </select>
          </div>

          {/* Risk Level Filter */}
          <select
            value={selectedRisk}
            onChange={(e) => setSelectedRisk(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-blue-400 font-medium"
          >
            <option value="All">{t('filterRiskAll', 'All Risk Levels')}</option>
            <option value="High">{t('filterRiskHigh', 'High Risk (>65%)')}</option>
            <option value="Medium">{t('filterRiskMedium', 'Medium Risk (35-65%)')}</option>
            <option value="Low">{t('filterRiskLow', 'Low Risk (<35%)')}</option>
          </select>

          {/* Max Distance Filter (Enabled when location anchor is set) */}
          {userCoords && (
            <div className="flex items-center gap-1.5 text-xs text-blue-600 font-semibold animate-fadeIn">
              <Compass className="w-3.5 h-3.5" />
              <select
                value={maxDistanceKm}
                onChange={(e) => setMaxDistanceKm(e.target.value)}
                className="bg-blue-50 border border-blue-200 rounded-xl px-3 py-2 text-xs text-blue-800 focus:outline-none focus:border-blue-400 font-bold"
              >
                <option value="all">Radius: All Distances</option>
                <option value="50">Within 50 km</option>
                <option value="100">Within 100 km</option>
                <option value="250">Within 250 km</option>
                <option value="500">Within 500 km</option>
                <option value="1000">Within 1,000 km</option>
              </select>
            </div>
          )}

          {/* Sort By */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <ArrowUpDown className="w-3.5 h-3.5" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-blue-400 font-medium"
            >
              {userCoords && <option value="nearest">📍 Nearest to {locationName ? locationName.split('(')[0].trim() : 'Location'}</option>}
              {userCoords && <option value="farthest">📍 Farthest from {locationName ? locationName.split('(')[0].trim() : 'Location'}</option>}
              <option value="risk_desc">{t('sortHighestRisk', 'Sort: Highest Risk First')}</option>
              <option value="risk_asc">{t('sortLowestRisk', 'Sort: Lowest Risk First')}</option>
              <option value="budget_desc">{t('sortHighestBudget', 'Sort: Highest Budget')}</option>
              <option value="progress_asc">{t('sortLowestProgress', 'Sort: Lowest Progress %')}</option>
            </select>
          </div>

        </div>

      </div>

      {/* ── View 1: Location & GIS Cards Grid View ── */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((p) => (
            <div
              key={p.id}
              className="rounded-2xl bg-white border border-slate-200 shadow-xs p-5 space-y-4 hover:border-blue-300 hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div className="space-y-3">
                {/* Location Badges Strip */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-600 font-mono font-bold text-[10px] border border-blue-200">
                    {p.project_code}
                  </span>
                  {p.distanceKm != null && (
                    <span className={`px-2 py-0.5 rounded-full font-mono font-bold text-[10px] border flex items-center gap-1 ${
                      p.distanceKm <= 50 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      p.distanceKm <= 200 ? 'bg-blue-50 text-blue-700 border-blue-200' :
                      'bg-indigo-50 text-indigo-700 border-indigo-200'
                    }`}>
                      <Compass className="w-3 h-3" />
                      {p.distanceKm} km away
                    </span>
                  )}
                  <RiskBadge level={p.overall_risk_level} score={p.overall_risk_score} />
                </div>

                {/* Project Title */}
                <div>
                  <Link
                    to={`/projects/${p.id}`}
                    className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors block text-sm line-clamp-2"
                  >
                    {p.name}
                  </Link>
                  <p className="text-[11px] text-slate-400 mt-0.5">{p.department}</p>
                </div>

                {/* Location & GIS Details Card */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-2 text-xs">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-1.5 text-slate-700">
                      <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold">{p.location}</span>
                        {p.mybharat_state && (
                          <span className="text-slate-500 block text-[11px]">
                            State: <strong>{p.mybharat_state}</strong> {p.mybharat_district ? `• Dist: ${p.mybharat_district}` : ''}
                          </span>
                        )}
                      </div>
                    </div>
                    {userCoords && p.coords && (
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&origin=${userCoords.lat},${userCoords.lng}&destination=${p.coords.lat},${p.coords.lng}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-0.5 shrink-0 bg-white px-2 py-1 rounded-md border border-slate-200 hover:bg-blue-50"
                        title="Get driving directions via Google Maps"
                      >
                        <Route className="w-3 h-3 text-blue-600" />
                        <span>Route</span>
                      </a>
                    )}
                  </div>

                  {/* Terrain & Landslide Hazard */}
                  <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-slate-200/60 font-mono">
                    <span className="text-slate-500">Terrain: {p.terrain_type || 'Plain'}</span>
                    {p.landslide_risk_pct !== undefined && p.landslide_risk_pct !== null && (
                      <span className={`font-bold flex items-center gap-1 ${
                        p.landslide_risk_pct >= 50 ? 'text-rose-600' :
                        p.landslide_risk_pct >= 25 ? 'text-amber-600' : 'text-emerald-600'
                      }`}>
                        <Mountain className="w-3 h-3 inline" />
                        <span>{p.landslide_risk_pct}% Hazard</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Progress & Budget */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px] font-mono text-slate-600">
                    <span>Progress: <strong>{p.current_progress_pct}%</strong></span>
                    <span>Budget: <strong>₹{p.budget_cr} Cr</strong></span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        p.current_progress_pct >= 100 ? 'bg-emerald-500' :
                        p.current_progress_pct > 50 ? 'bg-blue-500' : 'bg-amber-500'
                      }`}
                      style={{ width: `${Math.min(100, p.current_progress_pct)}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                <Link
                  to={`/projects/${p.id}`}
                  className="flex-1 py-2 rounded-lg bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white text-center text-xs font-bold transition-colors"
                >
                  View Telemetry
                </Link>
                <Link
                  to={`/transparency/project/${p.id}`}
                  className="px-3 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors border border-slate-200"
                  title="Civic Transparency Dossier"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── View 2: Detailed Table View ── */}
      {viewMode === 'table' && (
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs text-slate-400 font-mono">{t('loading', 'Loading...')}</p>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
              <MapPinOff className="w-10 h-10 text-slate-300" />
              <h3 className="text-base font-bold text-slate-600">{t('noProjectsFound', 'No Projects Found in Selected Location / Radius')}</h3>
              <p className="text-xs text-slate-400 max-w-sm">
                No monitored project matched your current location filters. You can expand your search radius or view all projects nationwide.
              </p>
              <div className="flex items-center gap-2 pt-2">
                {maxDistanceKm !== 'all' && (
                  <button
                    onClick={() => setMaxDistanceKm('all')}
                    className="px-3.5 py-1.5 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold hover:bg-blue-100 transition-colors"
                  >
                    Expand Radius to All Distances
                  </button>
                )}
                <button
                  onClick={handleClearLocation}
                  className="px-3.5 py-1.5 rounded-xl bg-white text-slate-700 border border-slate-200 text-xs font-bold hover:bg-slate-50 transition-colors"
                >
                  Reset Location Filter
                </button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 uppercase font-mono text-[11px]">
                    <th className="py-3.5 px-4">{t('dashProjectCode', 'Project & Location')}</th>
                    {userCoords && (
                      <th 
                        className="py-3.5 px-4 cursor-pointer hover:text-blue-600 select-none"
                        onClick={() => setSortBy(sortBy === 'nearest' ? 'farthest' : 'nearest')}
                        title="Click to toggle sorting by nearest/farthest distance"
                      >
                        <div className="flex items-center gap-1">
                          <span>Proximity</span>
                          <ArrowUpDown className="w-3 h-3 text-blue-500" />
                        </div>
                      </th>
                    )}
                    <th className="py-3.5 px-4">{t('dashDepartment', 'Department')}</th>
                    <th className="py-3.5 px-4">{t('tblSanctionedBudget', 'Sanctioned Budget')}</th>
                    <th className="py-3.5 px-4">{t('tblSpentToDate', 'Spent to Date')}</th>
                    <th className="py-3.5 px-4">{t('tblPhysicalProgress', 'Physical Progress')}</th>
                    <th className="py-3.5 px-4">{t('tableCostRisk', 'Cost Risk')}</th>
                    <th className="py-3.5 px-4">{t('tblScheduleRisk', 'Schedule Risk')}</th>
                    <th className="py-3.5 px-4">{t('dashRiskLevel', 'Overall Score')}</th>
                    <th className="py-3.5 px-4 text-right">{t('dashActions', 'Actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProjects.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="py-4 px-4 font-medium text-slate-800 max-w-xs">
                        <Link 
                          to={`/projects/${p.id}`}
                          className="font-bold text-slate-700 group-hover:text-blue-600 transition-colors block truncate"
                        >
                          {p.name}
                        </Link>
                        <div className="text-[10px] font-mono text-slate-400 flex items-center flex-wrap gap-1.5 mt-1">
                          <span className="text-blue-500 font-semibold">{p.project_code}</span>
                          <span>•</span>
                          <span className="text-slate-600 font-semibold flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-rose-500" />
                            {p.location}
                          </span>
                          {p.mybharat_state && (
                            <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-sans font-medium border border-blue-200">
                              {p.mybharat_state}
                            </span>
                          )}
                          {p.landslide_risk_pct !== undefined && p.landslide_risk_pct !== null && (
                            <span className={`px-1.5 py-0.5 rounded font-sans font-semibold border flex items-center gap-1 ${
                              p.landslide_risk_pct >= 50 
                                ? 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse' 
                                : p.landslide_risk_pct >= 25 
                                ? 'bg-amber-50 text-amber-700 border-amber-200' 
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            }`}>
                              <Mountain className="w-2.5 h-2.5 inline" />
                              <span>Landslide: {p.landslide_risk_pct}%</span>
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Proximity Distance Column */}
                      {userCoords && (
                        <td className="py-4 px-4 font-mono font-bold text-slate-700">
                          {p.distanceKm != null ? (
                            <div className="flex items-center gap-1.5">
                              <span className={`px-2 py-1 rounded-md text-[11px] inline-flex items-center gap-1 border font-bold ${
                                p.distanceKm <= 50 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                p.distanceKm <= 200 ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                'bg-indigo-50 text-indigo-700 border-indigo-200'
                              }`}>
                                <Compass className="w-3 h-3" />
                                {p.distanceKm} km
                              </span>
                              {p.coords && (
                                <a
                                  href={`https://www.google.com/maps/dir/?api=1&origin=${userCoords.lat},${userCoords.lng}&destination=${p.coords.lat},${p.coords.lng}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-blue-600 transition-colors"
                                  title="Open Google Maps Directions"
                                >
                                  <Route className="w-3.5 h-3.5" />
                                </a>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                      )}

                      <td className="py-4 px-4">
                        <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 border border-slate-200 text-[11px]">
                          {p.department}
                        </span>
                      </td>
                      <td className="py-4 px-4 font-mono font-semibold text-slate-700">
                        ₹{p.budget_cr.toLocaleString()} {t('crore', 'Cr')}
                      </td>
                      <td className="py-4 px-4 font-mono text-slate-500">
                        ₹{p.spent_cr.toLocaleString()} {t('crore', 'Cr')}
                      </td>
                      <td className="py-4 px-4">
                        <div className="w-28">
                          <div className="flex justify-between text-[10px] font-mono mb-1 text-slate-500">
                            <span>{p.current_progress_pct}%</span>
                            <span className="text-slate-400">{p.elapsed_months}/{p.planned_duration_months} {t('months', 'm')}</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden border border-slate-200">
                            <div 
                              className="bg-blue-500 h-full rounded-full" 
                              style={{ width: `${Math.min(100, p.current_progress_pct)}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 font-mono font-bold text-slate-700">
                        {p.cost_risk_score.toFixed(1)}%
                      </td>
                      <td className="py-4 px-4 font-mono font-bold text-amber-600">
                        +{p.predicted_delay_months} {t('months', 'm')}
                      </td>
                      <td className="py-4 px-4">
                        <RiskBadge level={p.overall_risk_level} score={p.overall_risk_score} />
                      </td>
                      <td className="py-4 px-4 text-right">
                        <Link
                          to={`/projects/${p.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white border border-blue-200 text-[11px] font-semibold transition-all"
                        >
                          <span>{t('btnAnalyze', 'Analyze')}</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
