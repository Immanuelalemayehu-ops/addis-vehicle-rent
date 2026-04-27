import { useEffect, useMemo, useState } from 'react'
import { supabase } from './supabaseClient'

const SEARCH_BRANDS = [
  '',
  'Toyota',
  'Hyundai',
  'Suzuki',
  'Nissan',
  'Kia',
  'Isuzu',
  'Mitsubishi',
  'Ford',
  'Peugeot',
  'Volkswagen',
  'Changan',
  'Geely',
  'BYD',
  'Jetour',
  'GAC',
  'Mercedes-Benz',
  'BMW',
  'Lexus',
  'Land Cruiser',
]

const VEHICLE_BRANDS = [
  'Toyota',
  'Hyundai',
  'Suzuki',
  'Nissan',
  'Kia',
  'Isuzu',
  'Mitsubishi',
  'Ford',
  'Peugeot',
  'Volkswagen',
  'Changan',
  'Geely',
  'BYD',
  'Jetour',
  'GAC',
  'Mercedes-Benz',
  'BMW',
  'Lexus',
  'Land Cruiser',
  'Other',
]

const VEHICLE_TYPES = [
  'SUV',
  'Sedan',
  'Pickup',
  'Hatchback',
  'Minivan',
  'Bus',
  'Truck',
  'EV',
  'Luxury',
  'Other',
]

const SEARCH_TYPES = ['', ...VEHICLE_TYPES.filter((item) => item !== 'Other')]

const LOCATIONS = [
  'Addis Ababa',
  'Adama',
  'Hawassa',
  'Bahir Dar',
  'Mekelle',
  'Semera',
  'Assosa',
  'Gambella',
  'Jigjiga',
  'Harar',
  'Dire Dawa',
  'Shashemene',
  'Robe',
  'Nekemte',
  'Wolaita Sodo',
  'Jinka',
  'Bonga',
  'Dilla',
  'Chiro',
  'Debre Birhan',
  'Hosaina',
  'Mizan Aman',
  'Arba Minch',
  'Gondar',
  'Other',
]

const SEARCH_LOCATIONS = ['', ...LOCATIONS.filter((item) => item !== 'Other')]
const MAX_PRICE_OPTIONS = ['', ...Array.from({ length: 20 }, (_, i) => String((i + 1) * 500))]
const CURRENT_YEAR = new Date().getFullYear()
const MODEL_YEARS = Array.from({ length: CURRENT_YEAR - 1994 }, (_, i) => String(CURRENT_YEAR - i))

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return isMobile
}

export default function App() {
  const isMobile = useIsMobile()
  const [user, setUser] = useState(null)
const adminEmail = "immanuelalemayehu@gmail.com"
const isAdmin = user?.email === adminEmail

  const [vehicles, setVehicles] = useState([])
  const [pendingVehicles, setPendingVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [showSearch, setShowSearch] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [selectedVehicle, setSelectedVehicle] = useState(null)
  const [hoveredNav, setHoveredNav] = useState('')

  const [searchBrand, setSearchBrand] = useState('')
  const [searchLocation, setSearchLocation] = useState('')
  const [searchType, setSearchType] = useState('')
  const [maxPrice, setMaxPrice] = useState('')

  const [title, setTitle] = useState('')
  const [brand, setBrand] = useState('')
  const [otherBrand, setOtherBrand] = useState('')
  const [vehicleType, setVehicleType] = useState('')
  const [otherVehicleType, setOtherVehicleType] = useState('')
  const [modelYear, setModelYear] = useState('')
  const [pricePerDay, setPricePerDay] = useState('')
  const [location, setLocation] = useState('Addis Ababa')
  const [otherLocation, setOtherLocation] = useState('')
  const [description, setDescription] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [selectedFiles, setSelectedFiles] = useState([null, null, null, null])
  const [imagePreviews, setImagePreviews] = useState(['', '', '', ''])
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadUser()
    loadVehicles()
    loadPendingVehicles()
  }, [])
  async function loadUser() {
  const { data, error } = await supabase.auth.getUser()

  if (error) {
    console.error(error.message)
  } else {
    setUser(data?.user || null)
  }
}
  async function loadVehicles() {
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('approval_status', 'approved')
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    if (error) {
      console.error(error.message)
    } else {
      setVehicles(data || [])
    }

    setLoading(false)
  }

  async function loadPendingVehicles() {
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('approval_status', 'pending')
      .order('created_at', { ascending: false })

    if (error) {
      console.error(error.message)
    } else {
      setPendingVehicles(data || [])
    }
  }

  function handleImageChange(index, file) {
    const updatedFiles = [...selectedFiles]
    updatedFiles[index] = file
    setSelectedFiles(updatedFiles)

    const updatedPreviews = [...imagePreviews]
    updatedPreviews[index] = file ? URL.createObjectURL(file) : ''
    setImagePreviews(updatedPreviews)
  }

  async function uploadSelectedImages() {
    const uploadedUrls = []

    for (let i = 0; i < selectedFiles.length; i += 1) {
      const file = selectedFiles[i]

      if (!file) {
        uploadedUrls.push('')
        continue
      }

      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${i}-${Math.random().toString(36).slice(2)}.${fileExt}`
      const filePath = `vehicle-uploads/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('vehicle-images')
        .upload(filePath, file)

      if (uploadError) {
        throw new Error(uploadError.message)
      }

      const { data } = supabase.storage
        .from('vehicle-images')
        .getPublicUrl(filePath)

      uploadedUrls.push(data.publicUrl)
    }

    return uploadedUrls
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)

    try {
      const finalBrand = brand === 'Other' ? otherBrand.trim() : brand
      const finalVehicleType = vehicleType === 'Other' ? otherVehicleType.trim() : vehicleType
      const finalLocation = location === 'Other' ? otherLocation.trim() : location

      if (!finalBrand) throw new Error('Please select or enter a vehicle brand.')
      if (!finalVehicleType) throw new Error('Please select or enter a vehicle type.')
      if (!finalLocation) throw new Error('Please select or enter a location.')
      if (!selectedFiles[0]) throw new Error('Please upload at least one vehicle image.')

      const uploadedUrls = await uploadSelectedImages()

      const composedTitle = title.trim()
        ? `${finalBrand} ${title.trim()}`
        : `${finalBrand} ${modelYear}`

      const { error } = await supabase.from('vehicles').insert([
        {
          title: composedTitle,
          vehicle_type: finalVehicleType,
          model_year: Number(modelYear),
          price_per_day: Number(pricePerDay),
          location: finalLocation,
          description,
          phone_number: phoneNumber,
          image_url: uploadedUrls[0] || '',
          image_url_2: uploadedUrls[1] || '',
          image_url_3: uploadedUrls[2] || '',
          image_url_4: uploadedUrls[3] || '',
          approval_status: 'pending',
        },
      ])

      if (error) throw new Error(error.message)

      alert('Vehicle submitted successfully. It is now pending admin approval.')

      setTitle('')
      setBrand('')
      setOtherBrand('')
      setVehicleType('')
      setOtherVehicleType('')
      setModelYear('')
      setPricePerDay('')
      setLocation('Addis Ababa')
      setOtherLocation('')
      setDescription('')
      setPhoneNumber('')
      setSelectedFiles([null, null, null, null])
      setImagePreviews(['', '', '', ''])
      setShowForm(false)

      loadPendingVehicles()
    } catch (err) {
      alert(err.message || 'Failed to submit vehicle.')
    } finally {
      setSubmitting(false)
    }
  }

  async function approveVehicle(id) {
    const { error } = await supabase
      .from('vehicles')
      .update({ approval_status: 'approved' })
      .eq('id', id)

    if (error) {
      alert('Failed to approve vehicle: ' + error.message)
      return
    }

    alert('Vehicle approved successfully.')
    loadVehicles()
    loadPendingVehicles()
  }

  async function deleteVehicle(id) {
    const { error } = await supabase
      .from('vehicles')
      .delete()
      .eq('id', id)

    if (error) {
      alert('Failed to delete vehicle: ' + error.message)
      return
    }

    alert('Vehicle deleted successfully.')
    loadVehicles()
    loadPendingVehicles()
  }

  function getImages(vehicle) {
    return [
      vehicle.image_url,
      vehicle.image_url_2,
      vehicle.image_url_3,
      vehicle.image_url_4,
    ].filter(Boolean)
  }

  const filteredVehicles = useMemo(() => {
    return vehicles.filter((vehicle) => {
      const text = `${vehicle.title} ${vehicle.location} ${vehicle.vehicle_type}`.toLowerCase()
      const matchesBrand = searchBrand ? text.includes(searchBrand.toLowerCase()) : true
      const matchesLocation = searchLocation
        ? vehicle.location?.toLowerCase().includes(searchLocation.toLowerCase())
        : true
      const matchesType = searchType
        ? vehicle.vehicle_type?.toLowerCase().includes(searchType.toLowerCase())
        : true
      const matchesPrice = maxPrice
        ? Number(vehicle.price_per_day) <= Number(maxPrice)
        : true

      return matchesBrand && matchesLocation && matchesType && matchesPrice
    })
  }, [vehicles, searchBrand, searchLocation, searchType, maxPrice])

  function VehicleDetailsModal({ vehicle, onClose }) {
    if (!vehicle) return null

    const images = getImages(vehicle)
    const whatsappNumber = vehicle.phone_number
      ? vehicle.phone_number.replace(/\D/g, '')
      : '251922800168'

    const whatsappLink = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
      `Hello, I am interested in renting the ${vehicle.title}.`
    )}`
    const emailLink = `mailto:immanuelalemayehu@gmail.com?subject=${encodeURIComponent(
      `Rental inquiry - ${vehicle.title}`
    )}`

    return (
      <div onClick={onClose} style={styles.modalOverlay}>
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            ...styles.modalCard,
            maxWidth: isMobile ? '95%' : '980px',
            padding: isMobile ? '16px' : '22px',
          }}
        >
          <div
            style={{
              ...styles.modalHeader,
              flexDirection: isMobile ? 'column' : 'row',
              alignItems: isMobile ? 'flex-start' : 'center',
            }}
          >
            <div>
              <h2 style={{ ...styles.modalTitle, fontSize: isMobile ? '22px' : '28px' }}>{vehicle.title}</h2>
              <p style={styles.modalSubTitle}>Vehicle details</p>
            </div>
            <button onClick={onClose} style={styles.closeButton}>
              Close
            </button>
          </div>

          {images.length > 0 && (
            <div
              style={{
                ...styles.modalImageGrid,
                gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
              }}
            >
              {images.map((image, index) => (
                <img key={index} src={image} alt={`${vehicle.title} ${index + 1}`} style={styles.modalImage} />
              ))}
            </div>
          )}

          <div
            style={{
              ...styles.detailGrid,
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, minmax(0, 1fr))',
            }}
          >
            <div><strong>Vehicle Type:</strong> {vehicle.vehicle_type || 'N/A'}</div>
            <div><strong>Model Year:</strong> {vehicle.model_year || 'N/A'}</div>
            <div><strong>Location:</strong> {vehicle.location || 'N/A'}</div>
            <div><strong>Daily Fee:</strong> ETB {vehicle.price_per_day || 'N/A'}</div>
            <div><strong>Phone:</strong> {vehicle.phone_number || 'N/A'}</div>
          </div>

          {vehicle.description && (
            <div style={styles.modalDescription}>
              <strong>Description:</strong> {vehicle.description}
            </div>
          )}

          <div style={styles.contactButtonRow}>
            <a href={`tel:${vehicle.phone_number || '251922800168'}`} style={styles.phoneLink}>Phone</a>
            <a href={whatsappLink} target="_blank" rel="noopener noreferrer" style={styles.whatsappLink}>WhatsApp</a>
            <a href="https://t.me/amanunic" target="_blank" rel="noopener noreferrer" style={styles.telegramLink}>Telegram</a>
            <a href={emailLink} style={styles.emailLink}>Email</a>
          </div>
        </div>
      </div>
    )
  }

  const inputStyle = {
    width: '100%',
    padding: isMobile ? '12px 12px' : '11px 12px',
    marginTop: '6px',
    borderRadius: '10px',
    border: '1px solid #d5dbe5',
    fontSize: isMobile ? '16px' : '13px',
    boxSizing: 'border-box',
    outline: 'none',
    fontFamily: '"Segoe UI", Arial, sans-serif',
    backgroundColor: '#ffffff',
    color: '#123C66',
  }

  const navItems = [
    ['home', 'Home'],
    ['browse', 'Browse'],
    ['list', 'Submit'],
    ['about', 'About'],
    ['contact', 'Contact'],
  ]

  return (
    <div style={styles.page}>
      <header
        style={{
          ...styles.navbar,
          padding: isMobile ? '10px 14px' : '12px 22px',
          backgroundColor: '#ffffff',
        }}
      >
        <div
          style={{
            ...styles.topBar,
            flexDirection: isMobile ? 'column' : 'row',
            alignItems: 'center',
            gap: isMobile ? '8px' : '14px',
          }}
        >
          <div
            style={{
              ...styles.headerBrandWrap,
              flexDirection: isMobile ? 'column' : 'row',
              justifyContent: 'center',
              textAlign: 'center',
              gap: isMobile ? '6px' : '8px',
            }}
          >
            <img
              src="/premium-logo.png"
              alt="RentaRide Addis Vehicle Rental Logo"
              style={{
                ...styles.brandLogoImage,
                width: isMobile ? '84px' : '112px',
              }}
            />
            <div style={styles.brandTextWrap}>
              <div
                style={{
                  ...styles.brandTitleLine,
                  fontSize: isMobile ? '18px' : '20px',
                  textAlign: 'center',
                }}
              >
                <span style={styles.brandOrange}>RentaRide</span>
                <span style={styles.brandBlue}> Addis Vehicle Rental</span>
              </div>
            </div>
          </div>

          <nav
            style={{
              ...styles.navLinks,
              marginLeft: isMobile ? '0' : 'auto',
              justifyContent: 'center',
              gap: isMobile ? '12px' : '18px',
            }}
          >
            {navItems.map(([id, label]) => (
              <a
                key={id}
                href={`#${id}`}
                style={{
                  ...styles.navTextLink,
                  ...(hoveredNav === id ? styles.navTextLinkHover : {}),
                  fontSize: isMobile ? '13px' : '14px',
                  color: '#f47c20',
                }}
                onMouseEnter={() => setHoveredNav(id)}
                onMouseLeave={() => setHoveredNav('')}
              >
                {label}
              </a>
            ))}
          </nav>
        </div>
      </header>

      <section
        id="home"
        style={{
          ...styles.heroSection,
          padding: isMobile ? '12px 10px 8px' : '18px 20px 10px',
        }}
      >
        <div style={styles.heroOverlay}>
          <div
            style={{
              ...styles.heroContent,
              minHeight: isMobile ? '330px' : '390px',
              padding: isMobile ? '22px 18px 24px' : '46px 34px 34px',
              alignItems: 'flex-start',
            }}
          >
            <div
              style={{
                ...styles.heroTextBlock,
                maxWidth: isMobile ? '100%' : '500px',
                marginTop: isMobile ? '0' : '-6px',
              }}
            >
              <h1
                style={{
                  ...styles.heroHeading,
                  fontSize: isMobile ? '21px' : '24px',
                  lineHeight: 1.25,
                  marginBottom: isMobile ? '10px' : '12px',
                  fontWeight: '800',
                }}
              >
                Find Trusted Rental Vehicles
                <br />
                Across Addis Ababa & Ethiopia
              </h1>

              <p
                style={{
                  ...styles.heroSubtext,
                  fontSize: isMobile ? '14px' : '15px',
                  lineHeight: 1.55,
                  maxWidth: isMobile ? '100%' : '450px',
                  marginBottom: '14px',
                  fontWeight: '600',
                }}
              >
                Browse trusted vehicles, connect directly with owners,
                <br />
                and rent with confidence.
              </p>

              <div
                style={{
                  ...styles.heroButtonRow,
                  flexDirection: isMobile ? 'column' : 'row',
                  width: isMobile ? '100%' : 'auto',
                }}
              >
                <button
                  onClick={() => setShowSearch((prev) => !prev)}
                  style={{
                    ...styles.primaryHeroButton,
                    width: isMobile ? '100%' : 'auto',
                    textAlign: 'center',
                    fontSize: isMobile ? '14px' : '13px',
                    padding: isMobile ? '12px 14px' : '10px 16px',
                  }}
                >
                  {showSearch ? 'Hide Search Filters' : 'Open Search Filters'}
                </button>

                <button
                  onClick={() => setShowForm((prev) => !prev)}
                  style={{
                    ...styles.secondaryHeroButton,
                    width: isMobile ? '100%' : 'auto',
                    textAlign: 'center',
                    fontSize: isMobile ? '14px' : '13px',
                    padding: isMobile ? '12px 14px' : '10px 16px',
                  }}
                >
                  {showForm ? 'Hide Vehicle Form' : 'Register Your Vehicle'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <main
        style={{
          ...styles.mainWrap,
          padding: isMobile ? '10px 10px 30px' : '16px 20px 50px',
        }}
      >
        <section id="browse" style={styles.panel}>
          <h2
            style={{
              ...styles.sectionTitleCentered,
              fontSize: isMobile ? '18px' : '22px',
            }}
          >
            Search Your Ideal Rental Vehicle
          </h2>

          <div style={styles.compactActionWrap}>
            <button
              onClick={() => setShowSearch((prev) => !prev)}
              style={styles.compactActionButton}
            >
              {showSearch ? 'Hide Search Filters' : 'Open Search Filters'}
            </button>
          </div>

          {showSearch && (
            <>
              <div
                style={{
                  ...styles.searchGrid,
                  gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, minmax(0, 1fr))',
                  marginTop: '16px',
                }}
              >
                <select value={searchBrand} onChange={(e) => setSearchBrand(e.target.value)} style={inputStyle}>
                  {SEARCH_BRANDS.map((item) => (
                    <option key={item || 'all-brands'} value={item}>
                      {item || 'All Brands'}
                    </option>
                  ))}
                </select>

                <select value={searchLocation} onChange={(e) => setSearchLocation(e.target.value)} style={inputStyle}>
                  {SEARCH_LOCATIONS.map((item) => (
                    <option key={item || 'all-locations'} value={item}>
                      {item || 'All Locations'}
                    </option>
                  ))}
                </select>

                <select value={searchType} onChange={(e) => setSearchType(e.target.value)} style={inputStyle}>
                  {SEARCH_TYPES.map((item) => (
                    <option key={item || 'all-types'} value={item}>
                      {item || 'All Vehicle Types'}
                    </option>
                  ))}
                </select>

                <select value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} style={inputStyle}>
                  {MAX_PRICE_OPTIONS.map((item) => (
                    <option key={item || 'all-prices'} value={item}>
                      {item ? `Max ETB ${item}` : 'Max Daily Price'}
                    </option>
                  ))}
                </select>
              </div>

              <div style={styles.resultsCount}>
                {loading ? 'Loading vehicles...' : `${filteredVehicles.length} vehicle(s) found`}
              </div>
            </>
          )}
        </section>

        <section id="list" style={styles.panel}>
          <h2
            style={{
              ...styles.sectionTitleCentered,
              fontSize: isMobile ? '18px' : '22px',
            }}
          >
            Vehicle Submission Form
          </h2>
          <p style={styles.sectionTextCentered}>
            Submit your vehicle with a cleaner and easier form.
          </p>

          <div style={styles.compactActionWrap}>
            <button
              onClick={() => setShowForm((prev) => !prev)}
              style={styles.compactActionButton}
            >
              {showForm ? 'Hide Vehicle Form' : 'Register Your Vehicle'}
            </button>
          </div>

          {showForm && (
            <div style={styles.formWrap}>
              <form onSubmit={handleSubmit}>
                <div
                  style={{
                    ...styles.formGrid,
                    gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, minmax(0, 1fr))',
                  }}
                >
                  <div>
                    <label>Vehicle Brand</label>
                    <select value={brand} onChange={(e) => setBrand(e.target.value)} style={inputStyle} required>
                      <option value="">Select brand</option>
                      {VEHICLE_BRANDS.map((item) => (
                        <option key={item} value={item}>{item}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label>Vehicle Name / Model</label>
                    <input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Example: Prado TXL, Vitz, Hilux"
                      style={inputStyle}
                      required
                    />
                  </div>

                  {brand === 'Other' && (
                    <div>
                      <label>Other Brand</label>
                      <input
                        value={otherBrand}
                        onChange={(e) => setOtherBrand(e.target.value)}
                        placeholder="Enter vehicle brand"
                        style={inputStyle}
                        required
                      />
                    </div>
                  )}

                  <div>
                    <label>Vehicle Type</label>
                    <select value={vehicleType} onChange={(e) => setVehicleType(e.target.value)} style={inputStyle} required>
                      <option value="">Select vehicle type</option>
                      {VEHICLE_TYPES.map((item) => (
                        <option key={item} value={item}>{item}</option>
                      ))}
                    </select>
                  </div>

                  {vehicleType === 'Other' && (
                    <div>
                      <label>Other Vehicle Type</label>
                      <input
                        value={otherVehicleType}
                        onChange={(e) => setOtherVehicleType(e.target.value)}
                        placeholder="Enter vehicle type"
                        style={inputStyle}
                        required
                      />
                    </div>
                  )}

                  <div>
                    <label>Model Year</label>
                    <select value={modelYear} onChange={(e) => setModelYear(e.target.value)} style={inputStyle} required>
                      <option value="">Select model year</option>
                      {MODEL_YEARS.map((year) => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label>Price Per Day (ETB)</label>
                    <input
                      type="number"
                      value={pricePerDay}
                      onChange={(e) => setPricePerDay(e.target.value)}
                      placeholder="Example: 5000"
                      style={inputStyle}
                      required
                    />
                  </div>

                  <div>
                    <label>Location</label>
                    <select value={location} onChange={(e) => setLocation(e.target.value)} style={inputStyle} required>
                      {LOCATIONS.map((item) => (
                        <option key={item} value={item}>{item}</option>
                      ))}
                    </select>
                  </div>

                  {location === 'Other' && (
                    <div>
                      <label>Other Location</label>
                      <input
                        value={otherLocation}
                        onChange={(e) => setOtherLocation(e.target.value)}
                        placeholder="Enter town or city"
                        style={inputStyle}
                        required
                      />
                    </div>
                  )}

                  <div>
                    <label>Phone Number</label>
                    <input
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="+251..."
                      style={inputStyle}
                      required
                    />
                  </div>

                  <div style={{ gridColumn: '1 / -1' }}>
                    <label>Description</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe the vehicle, condition, seats, fuel type, and rental details"
                      style={{ ...inputStyle, minHeight: '110px', resize: 'vertical' }}
                    />
                  </div>

                  <div style={{ gridColumn: '1 / -1' }}>
                    <label>Upload Vehicle Images</label>
                    <div
                      style={{
                        ...styles.uploadGrid,
                        gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, minmax(0, 1fr))',
                      }}
                    >
                      {[0, 1, 2, 3].map((index) => (
                        <label key={index} style={styles.uploadCard}>
                          <input
                            type="file"
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={(e) => handleImageChange(index, e.target.files?.[0] || null)}
                          />
                          {imagePreviews[index] ? (
                            <img src={imagePreviews[index]} alt={`Preview ${index + 1}`} style={styles.previewImage} />
                          ) : (
                            <div style={styles.uploadPlaceholder}>
                              Click to upload image {index + 1}
                            </div>
                          )}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  style={{
                    ...styles.orangeButtonSmall,
                    marginTop: '18px',
                    width: isMobile ? '100%' : 'auto',
                    fontSize: isMobile ? '14px' : '12px',
                    padding: isMobile ? '12px 14px' : '10px 15px',
                  }}
                  disabled={submitting}
                >
                  {submitting ? 'Submitting...' : 'Submit Vehicle'}
                </button>
              </form>
            </div>
          )}
        </section>

        <section style={styles.panel}>
          <h2
            style={{
              ...styles.sectionTitleCentered,
              fontSize: isMobile ? '18px' : '22px',
            }}
          >
            Featured Vehicles
          </h2>

          {!loading && filteredVehicles.length === 0 && <p>No approved vehicles found yet.</p>}

          {!loading && filteredVehicles.length > 0 && (
            <div
              style={{
                ...styles.vehicleGrid,
                gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, minmax(0, 1fr))',
              }}
            >
              {filteredVehicles.map((vehicle) => {
                const mainImage = getImages(vehicle)[0]

                return (
                  <div key={vehicle.id} style={styles.vehicleCard}>
                    {mainImage ? (
                      <img
                        src={mainImage}
                        alt={vehicle.title}
                        style={{
                          ...styles.vehicleCardImage,
                          height: isMobile ? '220px' : '200px',
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          ...styles.noImageBox,
                          height: isMobile ? '220px' : '200px',
                        }}
                      >
                        No image
                      </div>
                    )}

                    <div style={styles.vehicleCardBody}>
                      <h3 style={styles.vehicleCardTitle}>{vehicle.title}</h3>
                      <div style={styles.vehicleCardMeta}>
                        <div><strong>Daily price:</strong> ETB {vehicle.price_per_day}</div>
                        <div><strong>Location:</strong> {vehicle.location}</div>
                      </div>

                      <button
                        onClick={() => setSelectedVehicle(vehicle)}
                        style={{
                          ...styles.orangeButtonSmallWide,
                          fontSize: isMobile ? '13px' : '11px',
                          padding: isMobile ? '10px 12px' : '7px 12px',
                        }}
                      >
                        Show Details
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        <section id="about" style={styles.panel}>
          <h2
            style={{
              ...styles.sectionTitleCentered,
              fontSize: isMobile ? '18px' : '22px',
            }}
          >
            Why Choose RentaRide Addis Vehicle Rental
          </h2>
          <div style={styles.summaryWrap}>
            <p style={styles.summaryParagraph}>
              RentaRide connects renters and vehicle owners directly through one simple and trusted platform.
            </p>
            <p style={styles.summaryParagraph}>
              It supports better visibility, smoother transactions, and more value for users across Addis Ababa and Ethiopia.
            </p>
            <p style={styles.summaryParagraph}>
              Built with a modern approach, the platform is designed to grow into a stronger digital rental marketplace.
            </p>
          </div>
        </section>

        <section id="contact" style={styles.panel}>
          <h2
            style={{
              ...styles.sectionTitleCentered,
              fontSize: isMobile ? '18px' : '22px',
            }}
          >
            Contact Us
          </h2>
          <p style={styles.sectionTextCentered}>
            Reach us directly through the links below.
          </p>

          <div
            style={{
              ...styles.contactRowPlain,
              flexDirection: 'row',
              gap: isMobile ? '16px' : '26px',
              flexWrap: 'wrap',
            }}
          >
            <a href="tel:+251922800168" style={styles.phoneLink}>Phone</a>
            <a href="https://wa.me/251922800168" target="_blank" rel="noopener noreferrer" style={styles.whatsappLink}>WhatsApp</a>
            <a href="https://t.me/amanunic" target="_blank" rel="noopener noreferrer" style={styles.telegramLink}>Telegram</a>
            <a href="mailto:immanuelalemayehu@gmail.com" style={styles.emailLink}>Email</a>
          </div>
        </section>
        {isAdmin && (
        <section style={styles.panel}>
          <h2
            style={{
              ...styles.sectionTitleCentered,
              fontSize: isMobile ? '18px' : '22px',
            }}
          >
            Admin Approval Panel
          </h2>

          {pendingVehicles.length === 0 && <p>No pending vehicles.</p>}

          {pendingVehicles.length > 0 &&
            pendingVehicles.map((vehicle) => (
              <div key={vehicle.id} style={styles.pendingCard}>
                <h3 style={{ marginTop: 0 }}>{vehicle.title}</h3>
                <div style={styles.pendingMeta}>
                  <div><strong>Type:</strong> {vehicle.vehicle_type}</div>
                  <div><strong>Model Year:</strong> {vehicle.model_year}</div>
                  <div><strong>Location:</strong> {vehicle.location}</div>
                  <div><strong>Daily Fee:</strong> ETB {vehicle.price_per_day}</div>
                  <div><strong>Phone:</strong> {vehicle.phone_number}</div>
                </div>

                <div style={styles.adminButtonRow}>
                  <button onClick={() => approveVehicle(vehicle.id)} style={styles.approveButton}>Approve</button>
                  <button onClick={() => deleteVehicle(vehicle.id)} style={styles.deleteButton}>Delete</button>
                </div>
              </div>
            ))}
        </section>
        )}
      </main>

      <VehicleDetailsModal vehicle={selectedVehicle} onClose={() => setSelectedVehicle(null)} />
    </div>
  )
}

const styles = {
  page: {
    fontFamily: '"Segoe UI", Arial, sans-serif',
    background: '#f8fafc',
    minHeight: '100vh',
    color: '#1f2937',
  },

  navbar: {
    borderBottom: '1px solid #e5e7eb',
    boxShadow: '0 4px 14px rgba(15,23,42,0.05)',
    position: 'sticky',
    top: 0,
    zIndex: 20,
  },

  topBar: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },

  headerBrandWrap: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
  },

  brandLogoImage: {
    maxWidth: '100%',
    height: 'auto',
    objectFit: 'contain',
    display: 'block',
  },

  brandTextWrap: {
    display: 'flex',
    alignItems: 'center',
  },

  brandTitleLine: {
    fontFamily: '"Arial Black", "Trebuchet MS", "Segoe UI", sans-serif',
    fontWeight: '800',
    lineHeight: 1.1,
  },

  brandOrange: {
    color: '#f47c20',
  },

  brandBlue: {
    color: '#183f6a',
  },

  navLinks: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
  },

  navTextLink: {
    textDecoration: 'none',
    fontWeight: '700',
    transition: 'all 0.2s ease',
    padding: '2px 0',
  },

  navTextLinkHover: {
    textDecoration: 'underline',
    color: '#d96d16',
  },

  heroSection: {
    maxWidth: '1200px',
    margin: '0 auto',
  },

  heroOverlay: {
    borderRadius: '28px',
    overflow: 'hidden',
    backgroundImage: "linear-gradient(rgba(8,18,35,0.34), rgba(8,18,35,0.34)), url('/hero-bg-night.jpg')",
    backgroundSize: 'cover',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'center',
    boxShadow: '0 14px 30px rgba(0,0,0,0.08)',
    border: '1px solid #e5e7eb',
  },

  heroContent: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    textAlign: 'left',
  },

  heroTextBlock: {
    marginLeft: '4px',
  },

  heroHeading: {
    marginTop: 0,
    color: '#ffffff',
    textShadow: '0 4px 14px rgba(0,0,0,0.30)',
  },

  heroSubtext: {
    color: '#ffffff',
    textShadow: '0 4px 14px rgba(0,0,0,0.30)',
  },

  heroButtonRow: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap',
  },

  primaryHeroButton: {
    backgroundColor: '#f47c20',
    color: 'white',
    textDecoration: 'none',
    border: 'none',
    borderRadius: '10px',
    fontWeight: '700',
    cursor: 'pointer',
    boxShadow: '0 4px 10px rgba(244,124,32,0.16)',
  },

  secondaryHeroButton: {
    backgroundColor: '#163a63',
    color: '#ffffff',
    border: 'none',
    borderRadius: '10px',
    fontWeight: '700',
    cursor: 'pointer',
    boxShadow: '0 4px 10px rgba(22,58,99,0.14)',
  },

  mainWrap: {
    maxWidth: '1200px',
    margin: '0 auto',
  },

  panel: {
    backgroundColor: '#ffffff',
    borderRadius: '20px',
    padding: '22px',
    marginBottom: '22px',
    boxShadow: '0 8px 22px rgba(0,0,0,0.04)',
    border: '1px solid #edf0f4',
  },

  sectionTitleCentered: {
    marginTop: 0,
    marginBottom: '10px',
    color: '#123C66',
    fontWeight: '800',
    textAlign: 'center',
  },

  sectionTextCentered: {
    fontSize: '14px',
    color: '#4b5563',
    lineHeight: '1.6',
    textAlign: 'center',
  },

  compactActionWrap: {
    display: 'flex',
    justifyContent: 'center',
    marginTop: '14px',
  },

  compactActionButton: {
    backgroundColor: '#163a63',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    padding: '8px 14px',
    fontWeight: '700',
    fontSize: '13px',
    cursor: 'pointer',
  },

  searchGrid: {
    display: 'grid',
    gap: '10px',
  },

  resultsCount: {
    marginTop: '14px',
    fontSize: '13px',
    color: '#4b5563',
    textAlign: 'center',
  },

  formWrap: {
    marginTop: '18px',
    borderTop: '1px solid #e5e7eb',
    paddingTop: '18px',
  },

  formGrid: {
    display: 'grid',
    gap: '14px',
  },

  uploadGrid: {
    display: 'grid',
    gap: '12px',
    marginTop: '10px',
  },

  uploadCard: {
    border: '2px dashed #f47c20',
    borderRadius: '14px',
    overflow: 'hidden',
    cursor: 'pointer',
    minHeight: '140px',
    backgroundColor: '#fffaf5',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  uploadPlaceholder: {
    fontSize: '13px',
    color: '#c46318',
    textAlign: 'center',
    padding: '14px',
    fontWeight: '700',
  },

  previewImage: {
    width: '100%',
    height: '140px',
    objectFit: 'cover',
    display: 'block',
  },

  orangeButtonSmall: {
    backgroundColor: '#f47c20',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    fontWeight: '700',
  },

  orangeButtonSmallWide: {
    width: '100%',
    marginTop: '8px',
    backgroundColor: '#f47c20',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '700',
  },

  vehicleGrid: {
    display: 'grid',
    gap: '18px',
  },

  vehicleCard: {
    backgroundColor: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '18px',
    overflow: 'hidden',
    boxShadow: '0 6px 18px rgba(0,0,0,0.04)',
  },

  vehicleCardImage: {
    width: '100%',
    objectFit: 'cover',
    display: 'block',
  },

  noImageBox: {
    width: '100%',
    backgroundColor: '#f5f7fa',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#6b7280',
    fontSize: '12px',
  },

  vehicleCardBody: {
    padding: '10px 12px 12px',
  },

  vehicleCardTitle: {
    marginTop: 0,
    marginBottom: '4px',
    fontSize: '17px',
    color: '#123C66',
    fontWeight: '700',
    minHeight: '36px',
    lineHeight: '1.25',
  },

  vehicleCardMeta: {
    fontSize: '12px',
    color: '#556070',
    lineHeight: '1.45',
    fontFamily: '"Verdana", Arial, sans-serif',
  },

  summaryWrap: {
    display: 'grid',
    gap: '8px',
  },

  summaryParagraph: {
    margin: 0,
    fontSize: '13px',
    lineHeight: '1.45',
    color: '#4b5563',
    textAlign: 'center',
  },

  contactRowPlain: {
    display: 'flex',
    marginTop: '16px',
    justifyContent: 'center',
    alignItems: 'center',
  },

  phoneLink: {
    textDecoration: 'underline',
    color: '#dc2626',
    fontWeight: '600',
    fontSize: '14px',
  },

  whatsappLink: {
    textDecoration: 'underline',
    color: '#25D366',
    fontWeight: '600',
    fontSize: '14px',
  },

  telegramLink: {
    textDecoration: 'underline',
    color: '#229ED9',
    fontWeight: '600',
    fontSize: '14px',
  },

  emailLink: {
    textDecoration: 'underline',
    color: '#163a63',
    fontWeight: '600',
    fontSize: '14px',
  },

  pendingCard: {
    backgroundColor: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: '16px',
    padding: '18px',
    marginBottom: '16px',
  },

  pendingMeta: {
    fontSize: '13px',
    color: '#4b5563',
    lineHeight: '1.7',
  },

  adminButtonRow: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap',
    marginTop: '12px',
  },

  approveButton: {
    backgroundColor: '#16a34a',
    color: 'white',
    border: 'none',
    padding: '10px 16px',
    borderRadius: '10px',
    cursor: 'pointer',
    fontWeight: '700',
    fontSize: '13px',
  },

  deleteButton: {
    backgroundColor: '#dc2626',
    color: 'white',
    border: 'none',
    padding: '10px 16px',
    borderRadius: '10px',
    cursor: 'pointer',
    fontWeight: '700',
    fontSize: '13px',
  },

  modalOverlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.55)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '20px',
    zIndex: 1000,
  },

  modalCard: {
    backgroundColor: 'white',
    maxHeight: '90vh',
    overflowY: 'auto',
    borderRadius: '20px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
  },

  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '12px',
    flexWrap: 'wrap',
  },

  modalTitle: {
    margin: 0,
    color: '#123C66',
    fontWeight: '800',
  },

  modalSubTitle: {
    margin: '4px 0 0 0',
    color: '#6b7280',
    fontSize: '13px',
  },

  closeButton: {
    backgroundColor: '#ef4444',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    padding: '10px 14px',
    cursor: 'pointer',
    fontWeight: '700',
    fontSize: '13px',
  },

  modalImageGrid: {
    display: 'grid',
    gap: '12px',
    marginTop: '18px',
    marginBottom: '20px',
  },

  modalImage: {
    width: '100%',
    height: '220px',
    objectFit: 'cover',
    borderRadius: '14px',
    border: '1px solid #e5e7eb',
  },

  detailGrid: {
    display: 'grid',
    gap: '12px',
    fontSize: '13px',
    color: '#374151',
    lineHeight: '1.8',
  },

  modalDescription: {
    marginTop: '16px',
    color: '#374151',
    lineHeight: '1.8',
    fontSize: '13px',
  },

  contactButtonRow: {
    marginTop: '20px',
    display: 'flex',
    gap: '16px',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
  },
}