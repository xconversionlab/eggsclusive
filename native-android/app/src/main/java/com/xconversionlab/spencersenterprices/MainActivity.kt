package com.xconversionlab.spencersenterprices

import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInHorizontally
import androidx.compose.animation.slideOutHorizontally
import androidx.compose.animation.togetherWith
import androidx.compose.animation.core.animateFloat
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AccountCircle
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.ArrowForward
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.History
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Remove
import androidx.compose.material.icons.filled.ShoppingBasket
import androidx.compose.material.icons.filled.Wallet
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.launch
import kotlinx.coroutines.delay
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject
import java.text.NumberFormat
import java.security.SecureRandom
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.TimeZone

internal val Navy = Color(0xFF07172E)
internal val Blue = Color(0xFF168DE5)
internal val Paper = Color(0xFFF4F7FB)
internal val Ink = Color(0xFF14243A)
internal val Muted = Color(0xFF6B7A90)
internal val Line = Color(0xFFDCE5F0)
internal val PaleBlue = Color(0xFFEAF3FC)
internal val Green = Color(0xFF16845A)
private const val PRICE_PER_EGG_PAISE = 700
private const val PREFS_NAME = "spencers_native_customer"

private enum class MainTab(val label: String) { Order("Order"), Status("Status"), Profile("Profile") }

private data class SavedAddress(
    val id: String,
    val label: String,
    val door: String,
    val street: String,
    val area: String,
    val landmark: String,
    val city: String,
    val pincode: String,
    val latitude: Double,
    val longitude: Double,
) {
    val displayAddress: String get() = listOf(door, street, area, city, pincode).filter { it.isNotBlank() }.joinToString(", ")
}

private data class CustomerProfile(
    val name: String = "",
    val phone: String = "",
    val door: String = "",
    val street: String = "",
    val area: String = "",
    val landmark: String = "",
    val city: String = "Chennai",
    val pincode: String = "",
    val addressLabel: String = "Home",
    val latitude: Double = 13.0003,
    val longitude: Double = 80.2668,
    val phoneVerified: Boolean = false,
    val savedAddresses: List<SavedAddress> = emptyList(),
    val selectedAddressId: String = "",
) {
    val isReady: Boolean get() = name.isNotBlank() && phone.filter(Char::isDigit).length == 10 &&
        phoneVerified && door.isNotBlank() && street.isNotBlank() && area.isNotBlank() &&
        city.isNotBlank() && pincode.filter(Char::isDigit).length == 6
    val address: String get() = listOf(door, street, area, city, pincode).filter { it.isNotBlank() }.joinToString(", ")
    fun selectedAddress(): SavedAddress = savedAddresses.firstOrNull { it.id == selectedAddressId }
        ?: SavedAddress("home", addressLabel, door, street, area, landmark, city, pincode, latitude, longitude)
    fun withAddress(address: SavedAddress): CustomerProfile {
        val next = (savedAddresses.filterNot { it.id == address.id } + address).takeLast(4)
        return copy(
            door = address.door, street = address.street, area = address.area, landmark = address.landmark,
            city = address.city, pincode = address.pincode, addressLabel = address.label,
            latitude = address.latitude, longitude = address.longitude,
            savedAddresses = next, selectedAddressId = address.id,
        )
    }
}

private data class CustomerOrder(
    val id: String, val createdAt: Long, val quantity: Int, val slot: String,
    val payment: String, val totalPaise: Int, val status: String,
    val partnerName: String = "",
    val partnerPhone: String = "",
    val deliveryOtp: String = "",
    val addressLabel: String = "",
    val deliveryAddress: String = "",
    val refundApplied: Boolean = false,
)

private data class DeliveryPartner(
    val shopName: String,
    val riderName: String,
    val phone: String,
    val latitude: Double,
    val longitude: Double,
    val pricePerEggPaise: Int,
    val stockEggs: Int,
    val radiusKm: Double = 5.0,
)

private val DELIVERY_PARTNERS = listOf(
    DeliveryPartner("Murugan Egg Mart", "Selvam", "9841022001", 13.0003, 80.2668, 700, 420),
    DeliveryPartner("Lakshmi Naatu Kozhi", "Kannan", "9841022014", 13.0368, 80.2676, 720, 280),
    DeliveryPartner("Anna Fresh Trays", "Imran", "9841022030", 13.0850, 80.2101, 680, 640),
    DeliveryPartner("Velachery Sunrise", "Divya", "9841022042", 12.9815, 80.2180, 740, 180),
)

private fun distanceKm(lat1: Double, lon1: Double, lat2: Double, lon2: Double): Double {
    val toRadians = { value: Double -> value * Math.PI / 180.0 }
    val dLat = toRadians(lat2 - lat1)
    val dLon = toRadians(lon2 - lon1)
    val a = kotlin.math.sin(dLat / 2) * kotlin.math.sin(dLat / 2) +
        kotlin.math.cos(toRadians(lat1)) * kotlin.math.cos(toRadians(lat2)) *
        kotlin.math.sin(dLon / 2) * kotlin.math.sin(dLon / 2)
    return 6371.0 * 2.0 * kotlin.math.asin(kotlin.math.min(1.0, kotlin.math.sqrt(a)))
}

private fun servingPartner(profile: CustomerProfile): DeliveryPartner? =
    DELIVERY_PARTNERS
        .map { it to distanceKm(profile.latitude, profile.longitude, it.latitude, it.longitude) }
        .filter { (partner, distance) -> distance <= partner.radiusKm && partner.stockEggs > 0 }
        .minByOrNull { it.second }
        ?.first

private data class WalletTransaction(
    val id: String, val createdAt: Long, val title: String, val amountPaise: Int, val balancePaise: Int,
)

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        window.statusBarColor = android.graphics.Color.rgb(244, 247, 251)
        window.navigationBarColor = android.graphics.Color.WHITE
        window.decorView.systemUiVisibility =
            android.view.View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR or android.view.View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR
        setContent {
            MaterialTheme(colorScheme = lightColorScheme(
                primary = Navy, onPrimary = Color.White, secondary = Blue,
                background = Paper, surface = Color.White, onSurface = Ink,
                onBackground = Ink, outline = Line,
            )) { SpencersApp() }
        }
    }
}

@Composable
private fun SpencersApp() {
    val context = androidx.compose.ui.platform.LocalContext.current
    val prefs = remember { context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE) }
    val scope = rememberCoroutineScope()
    val snackbar = remember { SnackbarHostState() }
    var tab by rememberSaveable { mutableStateOf(MainTab.Order) }
    var historyPage by rememberSaveable { mutableStateOf("orders") }
    var profile by remember { mutableStateOf(loadProfile(prefs)) }
    var sessionToken by remember { mutableStateOf(prefs.getString("native_session_token", "").orEmpty()) }
    var orders by remember { mutableStateOf(loadOrders(prefs)) }
    var walletBalance by remember { mutableIntStateOf(prefs.getInt("wallet_balance", 0)) }
    var walletEntries by remember { mutableStateOf(loadWallet(prefs)) }
    var quantity by rememberSaveable { mutableIntStateOf(12) }
    var slot by rememberSaveable { mutableStateOf("Morning · 7:30–9:30 AM") }
    var payment by rememberSaveable { mutableStateOf("UPI · demo") }
    var showTopUp by remember { mutableStateOf(false) }
    var showMap by remember { mutableStateOf(false) }
    var showSplash by rememberSaveable { mutableStateOf(true) }
    var placingOrder by remember { mutableStateOf(false) }

    LaunchedEffect(Unit) {
        delay(950)
        showSplash = false
    }

    fun saveProfile(next: CustomerProfile) {
        val hasAddress = next.door.isNotBlank() || next.street.isNotBlank() || next.area.isNotBlank()
        val addressId = next.selectedAddressId.ifBlank { "home" }
        val selected = SavedAddress(addressId, next.addressLabel.ifBlank { "Home" }, next.door, next.street, next.area,
            next.landmark, next.city, next.pincode, next.latitude, next.longitude)
        val addresses = if (hasAddress) (next.savedAddresses.filterNot { it.id == addressId } + selected).takeLast(4) else next.savedAddresses
        val saved = next.copy(savedAddresses = addresses, selectedAddressId = if (hasAddress) addressId else next.selectedAddressId)
        profile = saved
        val array = JSONArray()
        addresses.forEach { address -> array.put(JSONObject().apply {
            put("id", address.id); put("label", address.label); put("door", address.door)
            put("street", address.street); put("area", address.area); put("landmark", address.landmark)
            put("city", address.city); put("pincode", address.pincode)
            put("latitude", address.latitude); put("longitude", address.longitude)
        }) }
        prefs.edit().putString("profile_name", saved.name).putString("profile_phone", saved.phone)
            .putString("profile_door", saved.door).putString("profile_street", saved.street)
            .putString("profile_area", saved.area).putString("profile_landmark", saved.landmark)
            .putString("profile_city", saved.city).putString("profile_pincode", saved.pincode)
            .putString("profile_address_label", saved.addressLabel)
            .putString("profile_selected_address_id", saved.selectedAddressId)
            .putString("profile_saved_addresses", array.toString())
            .putFloat("profile_latitude", saved.latitude.toFloat()).putFloat("profile_longitude", saved.longitude.toFloat())
            .putBoolean("profile_phone_verified", saved.phoneVerified).apply()
    }
    fun updateWallet(nextBalance: Int, entry: WalletTransaction) {
        walletBalance = nextBalance
        walletEntries = listOf(entry) + walletEntries
        prefs.edit().putInt("wallet_balance", nextBalance).apply()
        saveWallet(prefs, walletEntries)
    }
    fun placeOrder() {
        if (placingOrder) return
        if (!profile.isReady || sessionToken.isBlank()) {
            tab = MainTab.Profile
            scope.launch { snackbar.showSnackbar("Complete your verified mobile profile and delivery address first.") }
            return
        }
        val partner = servingPartner(profile)
        if (partner == null) {
            tab = MainTab.Profile
            scope.launch { snackbar.showSnackbar("Delivery is not available at this map location yet.") }
            return
        }
        if (quantity > partner.stockEggs) {
            scope.launch { snackbar.showSnackbar("Only ${partner.stockEggs} eggs are currently available from ${partner.shopName}.") }
            return
        }
        val estimatedTotal = quantity * partner.pricePerEggPaise
        if (payment == "Wallet" && walletBalance < estimatedTotal) {
            tab = MainTab.Status
            historyPage = "wallet"
            scope.launch { snackbar.showSnackbar("Your wallet balance is not enough. Choose UPI demo or add demo wallet funds.") }
            return
        }

        placingOrder = true
        scope.launch {
            try {
                val addressJson = JSONObject()
                    .put("label", profile.addressLabel)
                    .put("door", profile.door)
                    .put("street", profile.street)
                    .put("area", profile.area)
                    .put("landmark", profile.landmark)
                    .put("city", profile.city)
                    .put("pincode", profile.pincode)
                    .put("latitude", profile.latitude)
                    .put("longitude", profile.longitude)
                val requestBody = JSONObject()
                    .put("quantity", quantity)
                    .put("payment", payment)
                    .put("address", addressJson)
                val response = withContext(Dispatchers.IO) {
                    nativeApiRequest("/api/native/orders", "POST", requestBody, sessionToken)
                }
                val remote = response.optJSONObject("order")
                    ?: throw IllegalStateException("The server did not return the placed order.")
                val orderId = remote.optString("id")
                val total = remote.optInt("totalPaise", estimatedTotal)
                val now = System.currentTimeMillis()
                val placed = CustomerOrder(
                    id = orderId,
                    createdAt = now,
                    quantity = remote.optInt("quantity", quantity),
                    slot = "",
                    payment = remote.optString("payment", payment),
                    totalPaise = total,
                    status = "Order placed",
                    partnerName = remote.optString("partnerName"),
                    partnerPhone = remote.optString("partnerPhone"),
                    deliveryOtp = remote.optString("deliveryOtp"),
                    addressLabel = remote.optString("addressLabel", profile.addressLabel),
                    deliveryAddress = remote.optString("deliveryAddress", profile.address),
                )
                orders = listOf(placed) + orders.filterNot { it.id == orderId }
                saveOrders(prefs, orders)
                if (payment == "Wallet") {
                    val next = walletBalance - total
                    updateWallet(next, WalletTransaction("TX-" + orderId, now, "Payment for " + orderId, -total, next))
                }
                quantity = 12
                payment = "UPI · demo"
                tab = MainTab.Status
                historyPage = "orders"
                snackbar.showSnackbar("Order " + orderId + " placed. Your order is now saved to your account.")
            } catch (error: Exception) {
                snackbar.showSnackbar(error.message ?: "Could not place the order. Please try again.")
            } finally {
                placingOrder = false
            }
        }
    }

    if (showSplash) {
        Box(
            Modifier.fillMaxSize().background(Navy),
            contentAlignment = Alignment.Center,
        ) {
            Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(14.dp)) {
                Image(
                    painter = painterResource(id = R.drawable.spencers_logo),
                    contentDescription = "Spencer's Enterprises original logo",
                    modifier = Modifier.width(270.dp).height(222.dp),
                    contentScale = ContentScale.Fit,
                )
                Text("Deliver your Home Needs", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 18.sp)
            }
        }
        return
    }

    if (!profile.phoneVerified || sessionToken.isBlank()) {
        LoginScreen(
            onRequestOtp = { phone ->
                withContext(Dispatchers.IO) {
                    val result = nativeApiRequest(
                        "/api/native/auth/request-otp",
                        "POST",
                        JSONObject().put("phone", phone),
                    )
                    result.optString("message", "OTP sent.")
                }
            },
            onVerify = { name, phone, code ->
                withContext(Dispatchers.IO) {
                    val result = nativeApiRequest(
                        "/api/native/auth/verify-otp",
                        "POST",
                        JSONObject().put("name", name).put("phone", phone).put("code", code),
                    )
                    val token = result.optString("token")
                    if (token.isBlank()) throw IllegalStateException("Login could not be completed.")
                    sessionToken = token
                    prefs.edit().putString("native_session_token", token).apply()
                    saveProfile(profile.copy(name = name.trim(), phone = phone, phoneVerified = true))
                    true
                }
            },
        )
        return
    }

    LaunchedEffect(tab, sessionToken) {
        if (tab == MainTab.Status && sessionToken.isNotBlank()) {
            while (true) {
                try {
                    val result = withContext(Dispatchers.IO) {
                        nativeApiRequest("/api/native/orders", "GET", bearerToken = sessionToken)
                    }
                    val remoteOrders = result.optJSONArray("orders") ?: JSONArray()
                    val synced = (0 until remoteOrders.length()).mapNotNull { index ->
                        val item = remoteOrders.optJSONObject(index) ?: return@mapNotNull null
                        val rawStatus = item.optString("status")
                        val displayStatus = when (rawStatus) {
                            "placed" -> "Order placed"
                            "accepted" -> "Partner allocated"
                            "preparing" -> "Preparing"
                            "out_for_delivery" -> "Out for delivery"
                            "delivered" -> "Delivered"
                            "cancelled" -> "Cancelled"
                            else -> rawStatus
                        }
                        CustomerOrder(
                            id = item.optString("id"),
                            createdAt = item.optLong("createdAt"),
                            quantity = item.optInt("quantity"),
                            slot = "",
                            payment = item.optString("payment"),
                            totalPaise = item.optInt("totalPaise"),
                            status = displayStatus,
                            partnerName = item.optString("partnerName"),
                            partnerPhone = item.optString("partnerPhone"),
                            deliveryOtp = item.optString("deliveryOtp"),
                            addressLabel = item.optString("addressLabel"),
                            deliveryAddress = item.optString("deliveryAddress"),
                        )
                    }
                    orders = synced
                    saveOrders(prefs, synced)
                } catch (error: Exception) {
                    val message = error.message.orEmpty()
                    if (message.contains("log in again", ignoreCase = true) ||
                        message.contains("authorization", ignoreCase = true)) {
                        sessionToken = ""
                        prefs.edit().remove("native_session_token").apply()
                        profile = profile.copy(phoneVerified = false)
                        prefs.edit().putBoolean("profile_phone_verified", false).apply()
                        snackbar.showSnackbar("Your session expired. Please verify your mobile number again.")
                        break
                    }
                }
                delay(20000)
            }
        }
    }

    if (showMap) {
        MapPickerScreen(
            initialLatitude = profile.latitude,
            initialLongitude = profile.longitude,
            onCancel = { showMap = false },
            onConfirm = { latitude, longitude ->
                scope.launch {
                    val resolved = reverseGeocodeLocation(context, latitude, longitude)
                    val next = profile.copy(
                        latitude = latitude,
                        longitude = longitude,
                        street = resolved?.street?.takeIf { it.isNotBlank() } ?: profile.street,
                        area = resolved?.area?.takeIf { it.isNotBlank() } ?: profile.area,
                        city = resolved?.city?.takeIf { it.isNotBlank() } ?: profile.city,
                    )
                    saveProfile(next)
                    showMap = false
                    snackbar.showSnackbar("Delivery pin saved. Review the address details before placing an order.")
                }
            },
        )
        return
    }

    val activePartner = servingPartner(profile)

    Scaffold(
        containerColor = Paper,
        snackbarHost = { SnackbarHost(snackbar) },
        bottomBar = {
            NavigationBar(containerColor = Color.White, tonalElevation = 10.dp) {
                NavigationBarItem(tab == MainTab.Order, { tab = MainTab.Order }, icon = { Icon(Icons.Filled.ShoppingBasket, null) }, label = { Text("Order") })
                NavigationBarItem(tab == MainTab.Status, { tab = MainTab.Status }, icon = { Icon(Icons.Filled.History, null) }, label = { Text("Status", maxLines = 1) })
                NavigationBarItem(tab == MainTab.Profile, { tab = MainTab.Profile }, icon = { Icon(Icons.Filled.Person, null) }, label = { Text("Profile") })
            }
        },
    ) { inner ->
        AnimatedContent(
            targetState = tab,
            modifier = Modifier.fillMaxSize().padding(inner),
            transitionSpec = {
                (fadeIn() + slideInHorizontally { it / 18 }) togetherWith
                    (fadeOut() + slideOutHorizontally { -it / 18 })
            },
            label = "native-tab-transition",
        ) { activeTab ->
            when (activeTab) {
                MainTab.Order -> OrderScreen(
                    profile, activePartner, quantity, { quantity = it.coerceIn(1, 360) },
                    payment, { payment = it }, walletBalance, ::placeOrder,
                    onOpenProfile = { tab = MainTab.Profile },
                    onOpenMap = { tab = MainTab.Profile; showMap = true },
                    onPartnerEnquiry = { name, phone ->
                        shareMessage(context, "Partner with Spencer's Enterprises", "I would like to partner with Spencer's Enterprises.\nName: " + name + "\nPhone: " + phone)
                    },
                    onProductEnquiry = { product -> shareMessage(context, "Product price enquiry", "Please share availability and price for: " + product) },
                )
                MainTab.Status -> ActivityScreen(historyPage, { historyPage = it }, orders, walletBalance, walletEntries, { showTopUp = true })
                MainTab.Profile -> ProfileScreen(
                    profile, { profile = it },
                    { saveProfile(profile); scope.launch { snackbar.showSnackbar("Profile and saved addresses updated on this device.") } },
                    { showMap = true },
                    onComplaint = { complaint ->
                        val ticketId = "SPC-" + SimpleDateFormat("yyMMdd-HHmmss", Locale.US).format(Date())
                        val tickets = JSONArray(prefs.getString("support_tickets", "[]"))
                        tickets.put(JSONObject().apply {
                            put("id", ticketId); put("createdAt", System.currentTimeMillis())
                            put("customer", profile.name); put("phone", profile.phone)
                            put("message", complaint); put("status", "Ready to share")
                        })
                        prefs.edit().putString("support_tickets", tickets.toString()).apply()
                        shareMessage(
                            context, "Customer complaint $ticketId",
                            "Ticket: $ticketId\nCustomer: " + profile.name + "\nPhone: " + profile.phone + "\nComplaint: " + complaint,
                        )
                    },
                )
            }
        }
    }

    if (showTopUp) {
        AlertDialog(
            onDismissRequest = { showTopUp = false },
            title = { Text("Add money to wallet") },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(9.dp)) {
                    Text("Choose a test amount. Demo funds stay on this phone; no real payment is collected.", color = Muted, fontSize = 13.sp)
                    listOf(100, 500, 1000).forEach { rupees ->
                        OutlinedButton(onClick = {
                            val amount = rupees * 100
                            val next = walletBalance + amount
                            val now = System.currentTimeMillis()
                            updateWallet(next, WalletTransaction("TX-" + now, now, "Demo wallet top-up", amount, next))
                            showTopUp = false
                            scope.launch { snackbar.showSnackbar("₹" + rupees + " demo balance added.") }
                        }, modifier = Modifier.fillMaxWidth()) { Text("Add ₹" + rupees + " demo balance") }
                    }
                }
            },
            confirmButton = { TextButton(onClick = { showTopUp = false }) { Text("Close") } },
        )
    }
}

@Composable
private fun OrderScreen(
    profile: CustomerProfile,
    partner: DeliveryPartner?,
    quantity: Int,
    onQuantityChange: (Int) -> Unit,
    payment: String,
    onPaymentChange: (String) -> Unit,
    walletBalance: Int,
    onPlaceOrder: () -> Unit,
    onOpenProfile: () -> Unit,
    onOpenMap: () -> Unit,
    onPartnerEnquiry: (String, String) -> Unit,
    onProductEnquiry: (String) -> Unit,
) {
    val unitPrice = partner?.pricePerEggPaise ?: PRICE_PER_EGG_PAISE
    val total = quantity * unitPrice
    var partnerDialog by rememberSaveable { mutableStateOf(false) }
    var partnerContactName by rememberSaveable { mutableStateOf("") }
    var partnerContactPhone by rememberSaveable { mutableStateOf("") }

    Column(
        Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(horizontal = 18.dp, vertical = 14.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp),
    ) {
        Card(
            colors = CardDefaults.cardColors(containerColor = Navy),
            shape = RoundedCornerShape(25.dp),
            modifier = Modifier.fillMaxWidth(),
        ) {
            Row(
                Modifier.fillMaxWidth().padding(18.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(7.dp)) {
                    Text("SPENCERS ENTERPRISES", color = Color(0xFF8DCFFF), fontSize = 11.sp,
                        fontWeight = FontWeight.ExtraBold, letterSpacing = 1.5.sp)
                    Text("Deliver your Home Needs", color = Color.White, fontSize = 20.sp,
                        fontWeight = FontWeight.ExtraBold, lineHeight = 25.sp)
                }
                BrandMark(62.dp, onDark = true, animate = true)
            }
        }

        SectionHeading("Products Available", "Choose what you need")

        Card(
            colors = CardDefaults.cardColors(containerColor = Color.White),
            shape = RoundedCornerShape(21.dp),
            elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
            modifier = Modifier.fillMaxWidth(),
        ) {
            Row(
                Modifier.fillMaxWidth().padding(14.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(13.dp),
            ) {
                Column(Modifier.width(76.dp), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(5.dp)) {
                    Box(Modifier.size(46.dp).clip(RoundedCornerShape(14.dp)).background(PaleBlue), contentAlignment = Alignment.Center) {
                        Text("🥚", fontSize = 26.sp)
                    }
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(5.dp)) {
                        Text("−", color = if (quantity > 1) Navy else Muted, fontWeight = FontWeight.Black,
                            modifier = Modifier.clickable(enabled = quantity > 1) { onQuantityChange(quantity - 1) })
                        Text(quantity.toString(), fontSize = 12.sp, fontWeight = FontWeight.ExtraBold, color = Navy)
                        Text("+", color = if (partner != null && quantity < partner.stockEggs) Navy else Muted,
                            fontWeight = FontWeight.Black,
                            modifier = Modifier.clickable(enabled = partner != null && quantity < partner.stockEggs) { onQuantityChange(quantity + 1) })
                    }
                    Text("Quantity", color = Muted, fontSize = 9.sp)
                }
                Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(5.dp)) {
                    Text("Fresh Egg", color = Navy, fontWeight = FontWeight.ExtraBold, fontSize = 17.sp)
                    Text(money(unitPrice) + " per egg", color = Blue, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                    Text("Select quantity below the product image.", color = Muted, fontSize = 10.sp)
                }
                Column(horizontalAlignment = Alignment.End) {
                    Text(money(total), color = Navy, fontSize = 16.sp, fontWeight = FontWeight.ExtraBold)
                    Text("Line total", color = Muted, fontSize = 9.sp)
                }
            }
        }

        listOf(
            Triple("Water Can", "🫗", "Price and can size to be confirmed"),
            Triple("Milk", "🥛", "Price and pack size to be confirmed"),
            Triple("Curd", "🥣", "Price and pack size to be confirmed"),
        ).forEach { product ->
            Card(
                colors = CardDefaults.cardColors(containerColor = Color.White),
                shape = RoundedCornerShape(18.dp),
                modifier = Modifier.fillMaxWidth(),
            ) {
                Row(
                    Modifier.fillMaxWidth().padding(13.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                ) {
                    Box(Modifier.size(45.dp).clip(RoundedCornerShape(13.dp)).background(PaleBlue), contentAlignment = Alignment.Center) {
                        Text(product.second, fontSize = 25.sp)
                    }
                    Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                        Text(product.first, color = Navy, fontWeight = FontWeight.ExtraBold, fontSize = 14.sp)
                        Text(product.third, color = Muted, fontSize = 10.sp)
                    }
                    TextButton(onClick = { onProductEnquiry(product.first) }) { Text("Enquire", color = Blue, fontWeight = FontWeight.Bold) }
                }
            }
        }

        Card(
            colors = CardDefaults.cardColors(containerColor = Color.White),
            shape = RoundedCornerShape(17.dp),
            modifier = Modifier.fillMaxWidth().clickable { partnerDialog = true },
        ) {
            Row(Modifier.fillMaxWidth().padding(14.dp), verticalAlignment = Alignment.CenterVertically) {
                Box(Modifier.size(42.dp).clip(RoundedCornerShape(13.dp)).background(PaleBlue), contentAlignment = Alignment.Center) {
                    Text("🤝", fontSize = 23.sp)
                }
                Column(Modifier.weight(1f).padding(start = 11.dp), verticalArrangement = Arrangement.spacedBy(3.dp)) {
                    Text("Partner with us", color = Navy, fontWeight = FontWeight.ExtraBold, fontSize = 14.sp)
                    Text("Interested in working with Spencer's Enterprises?", color = Muted, fontSize = 10.sp)
                }
                Icon(Icons.Filled.ArrowForward, null, tint = Blue)
            }
        }

        SectionHeading("Delivery address", "Choose or update the address in your profile")
        Card(colors = CardDefaults.cardColors(containerColor = Color.White), shape = RoundedCornerShape(17.dp), modifier = Modifier.fillMaxWidth()) {
            Column(Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Filled.LocationOn, null, tint = Blue)
                    Text(profile.addressLabel, fontWeight = FontWeight.ExtraBold, color = Navy, modifier = Modifier.padding(start = 7.dp))
                    Spacer(Modifier.weight(1f))
                    TextButton(onClick = onOpenProfile) { Text("Change", color = Blue) }
                }
                if (profile.isReady) {
                    Text(profile.address, color = Ink, fontSize = 12.sp, lineHeight = 18.sp)
                } else {
                    Text("Complete your verified profile, city, pincode and address before checkout.", color = Muted, fontSize = 11.sp)
                    OutlinedButton(onClick = onOpenProfile, modifier = Modifier.fillMaxWidth()) { Text("Complete profile") }
                }
                OutlinedButton(onClick = onOpenMap, modifier = Modifier.fillMaxWidth()) {
                    Icon(Icons.Filled.LocationOn, null, tint = Blue)
                    Text("Pin this address on map", modifier = Modifier.padding(start = 7.dp))
                }
            }
        }

        SectionHeading("Payment method", "Cash on delivery is not available")
        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            SelectableRow("UPI · demo", "Demo checkout only. No money is transferred.", payment == "UPI · demo") { onPaymentChange("UPI · demo") }
            SelectableRow("Wallet", "Available balance: " + money(walletBalance), payment == "Wallet", walletBalance >= total) { onPaymentChange("Wallet") }
        }

        Card(colors = CardDefaults.cardColors(containerColor = Navy), shape = RoundedCornerShape(20.dp), modifier = Modifier.fillMaxWidth()) {
            Column(Modifier.padding(17.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text("ORDER SUMMARY", color = Color(0xFF8DCFFF), fontWeight = FontWeight.ExtraBold, fontSize = 10.sp, letterSpacing = 1.4.sp)
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text("Fresh Egg × $quantity", color = Color.White, fontSize = 13.sp, modifier = Modifier.weight(1f))
                    Text(money(total), color = Color.White, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                }
                Divider(color = Color.White.copy(alpha = .22f))
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text("Total", color = Color.White, fontWeight = FontWeight.ExtraBold, fontSize = 15.sp, modifier = Modifier.weight(1f))
                    Text(money(total), color = Color.White, fontWeight = FontWeight.ExtraBold, fontSize = 24.sp)
                }
            }
        }
        Button(
            onClick = onPlaceOrder,
            enabled = partner != null && profile.isReady && quantity <= (partner?.stockEggs ?: 0) &&
                (payment != "Wallet" || walletBalance >= total),
            modifier = Modifier.fillMaxWidth().height(55.dp),
            shape = RoundedCornerShape(17.dp),
            colors = ButtonDefaults.buttonColors(containerColor = Navy),
        ) {
            Text("Place order · " + money(total), fontWeight = FontWeight.ExtraBold, fontSize = 15.sp)
            Icon(Icons.Filled.ArrowForward, null, modifier = Modifier.padding(start = 9.dp))
        }
        if (partner == null) {
            Text("Ordering is not available for the selected map location yet.", color = Color(0xFF9A3412), fontSize = 11.sp)
        }
        Text(
            "Demo app: order and wallet data are stored on this phone. Live SMS, shared status updates and online payment are not connected.",
            Modifier.fillMaxWidth().padding(bottom = 8.dp), color = Muted, fontSize = 10.sp, lineHeight = 15.sp,
        )
    }

    if (partnerDialog) {
        AlertDialog(
            onDismissRequest = { partnerDialog = false },
            title = { Text("Partner with Spencer's Enterprises") },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Text("Would you like to partner with us? Share your contact details and we will get back to you.", color = Muted, fontSize = 12.sp)
                    AppTextField("Your name", partnerContactName, { partnerContactName = it })
                    AppTextField("Mobile number", partnerContactPhone, { partnerContactPhone = it.filter(Char::isDigit).take(10) }, KeyboardType.Phone)
                }
            },
            confirmButton = {
                TextButton(
                    onClick = {
                        onPartnerEnquiry(partnerContactName.trim(), partnerContactPhone)
                        partnerDialog = false
                        partnerContactName = ""
                        partnerContactPhone = ""
                    },
                    enabled = partnerContactName.isNotBlank() && partnerContactPhone.length == 10,
                ) { Text("Yes, contact me") }
            },
            dismissButton = { TextButton(onClick = { partnerDialog = false }) { Text("No, thanks") } },
        )
    }
}

@Composable
private fun ActivityScreen(
    page: String,
    onPageChange: (String) -> Unit,
    orders: List<CustomerOrder>,
    walletBalance: Int,
    walletEntries: List<WalletTransaction>,
    onAddFunds: () -> Unit,
) {
    Column(
        Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(horizontal = 18.dp, vertical = 14.dp),
        verticalArrangement = Arrangement.spacedBy(15.dp),
    ) {
        BrandHeader("YOUR ACCOUNT", "Status", "Track orders and view wallet activity.")
        Row(
            Modifier.fillMaxWidth().clip(RoundedCornerShape(15.dp)).background(Color.White).padding(4.dp),
            horizontalArrangement = Arrangement.spacedBy(4.dp),
        ) {
            InnerTab("Order status", page == "orders", Modifier.weight(1f)) { onPageChange("orders") }
            InnerTab("Wallet", page == "wallet", Modifier.weight(1f)) { onPageChange("wallet") }
        }
        if (page == "orders") {
            SectionHeading("Your orders", orders.size.toString() + " order(s)")
            if (orders.isEmpty()) {
                EmptyState("🧺", "No orders yet", "Your order and delivery updates will appear here.")
            } else orders.forEach { order ->
                val stageNames = listOf("Order placed", "Partner allocated", "Preparing", "Out for delivery", "Delivered")
                val stage = when (order.status.lowercase(Locale.US)) {
                    "order placed", "placed" -> if (order.partnerName.isNotBlank()) 1 else 0
                    "accepted", "partner allocated", "partner accepted" -> 1
                    "preparing" -> 2
                    "out_for_delivery", "out for delivery" -> 3
                    "delivered" -> 4
                    else -> -1
                }
                Card(
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    shape = RoundedCornerShape(20.dp),
                    modifier = Modifier.fillMaxWidth(),
                    elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
                ) {
                    Column(Modifier.padding(15.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Column(Modifier.weight(1f)) {
                                Text(order.id, fontWeight = FontWeight.ExtraBold, color = Navy)
                                Text(formatDate(order.createdAt), color = Muted, fontSize = 10.sp)
                            }
                            Surface(color = if (stage == 4) Color(0xFFE7F6EF) else if (stage < 0) Color(0xFFFFEDEC) else PaleBlue, shape = RoundedCornerShape(50)) {
                                Text(order.status, color = if (stage == 4) Green else if (stage < 0) Color(0xFFB42318) else Blue,
                                    fontWeight = FontWeight.Bold, fontSize = 10.sp, modifier = Modifier.padding(horizontal = 9.dp, vertical = 6.dp))
                            }
                        }
                        Divider(color = Line)
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text("Fresh Egg × ${order.quantity}", color = Ink, fontSize = 12.sp, modifier = Modifier.weight(1f))
                            Text(money(order.totalPaise), color = Navy, fontWeight = FontWeight.ExtraBold, fontSize = 16.sp)
                        }
                        if (stage >= 0) {
                            Column(verticalArrangement = Arrangement.spacedBy(7.dp)) {
                                stageNames.forEachIndexed { index, label ->
                                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                        Box(
                                            Modifier.size(19.dp).clip(CircleShape)
                                                .background(if (index <= stage) Blue else Line),
                                            contentAlignment = Alignment.Center,
                                        ) {
                                            if (index <= stage) Text("✓", color = Color.White, fontSize = 10.sp, fontWeight = FontWeight.Black)
                                        }
                                        Text(label, color = if (index <= stage) Navy else Muted, fontSize = 11.sp,
                                            fontWeight = if (index == stage) FontWeight.ExtraBold else FontWeight.Normal)
                                    }
                                }
                            }
                        } else if (order.status.equals("Cancelled", true)) {
                            Text(
                                if (order.refundApplied) "Cancelled by operations · refund credited to your wallet."
                                else "Cancelled by operations · wallet refund is pending confirmation.",
                                color = Color(0xFF9A3412), fontSize = 11.sp, lineHeight = 16.sp,
                            )
                        } else {
                            Text("This order status is being reviewed by the operations team.", color = Muted, fontSize = 11.sp)
                        }
                        if (order.partnerName.isNotBlank()) {
                            Divider(color = Line)
                            Text("DELIVERY PARTNER", color = Blue, fontSize = 9.sp, fontWeight = FontWeight.ExtraBold, letterSpacing = 1.2.sp)
                            Text(order.partnerName, color = Navy, fontWeight = FontWeight.ExtraBold, fontSize = 14.sp)
                            if (order.partnerPhone.isNotBlank()) Text("Partner contact: +91 ${order.partnerPhone}", color = Muted, fontSize = 11.sp)
                        } else {
                            Text("Delivery partner: awaiting allocation", color = Muted, fontSize = 11.sp)
                        }
                        if (order.deliveryOtp.isNotBlank() && stage in 0..3) {
                            Card(colors = CardDefaults.cardColors(containerColor = PaleBlue), shape = RoundedCornerShape(14.dp)) {
                                Column(Modifier.fillMaxWidth().padding(12.dp), verticalArrangement = Arrangement.spacedBy(3.dp)) {
                                    Text("DELIVERY OTP", color = Blue, fontSize = 9.sp, fontWeight = FontWeight.ExtraBold, letterSpacing = 1.2.sp)
                                    Text(order.deliveryOtp, color = Navy, fontSize = 22.sp, fontWeight = FontWeight.ExtraBold, letterSpacing = 3.sp)
                                    Text("Share this code with the delivery partner only when your order reaches you.", color = Muted, fontSize = 10.sp, lineHeight = 14.sp)
                                    Text("Share this code with your delivery partner when your order arrives.", color = Color(0xFF9A3412), fontSize = 9.sp)
                                }
                            }
                        }
                        if (order.deliveryAddress.isNotBlank()) {
                            Text(order.addressLabel + " · " + order.deliveryAddress, color = Muted, fontSize = 10.sp, lineHeight = 15.sp)
                        }
                        Text(
                            when (order.payment) {
                                "UPI · demo" -> "Payment: UPI demo (not charged)"
                                "Wallet" -> "Paid from wallet"
                                else -> "Payment: " + order.payment
                            },
                            color = Muted, fontSize = 10.sp,
                        )
                    }
                }
            }
            Text(
                "Status changes, partner acceptance and delivery completion must be sent by the connected partner/operations service. This APK currently stores the demo timeline on this phone.",
                color = Muted, fontSize = 10.sp, lineHeight = 15.sp,
            )
        } else {
            Card(colors = CardDefaults.cardColors(containerColor = Navy), shape = RoundedCornerShape(24.dp), modifier = Modifier.fillMaxWidth()) {
                Column(Modifier.padding(19.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Filled.Wallet, null, tint = Color(0xFF8DCFFF))
                        Text("SPENCERS WALLET", color = Color.White.copy(alpha = .72f), fontSize = 10.sp,
                            fontWeight = FontWeight.ExtraBold, letterSpacing = 1.4.sp, modifier = Modifier.padding(start = 8.dp))
                    }
                    Text(money(walletBalance), color = Color.White, fontSize = 32.sp, fontWeight = FontWeight.ExtraBold)
                    Text("Available balance", color = Color.White.copy(alpha = .7f), fontSize = 12.sp)
                    Button(onClick = onAddFunds, modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(13.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = Color.White, contentColor = Navy)) {
                        Text("Add demo funds", fontWeight = FontWeight.Bold)
                    }
                }
            }
            Text("Transactions", fontWeight = FontWeight.ExtraBold, color = Navy, fontSize = 17.sp)
            if (walletEntries.isEmpty()) {
                EmptyState("💳", "No wallet activity", "Wallet top-ups, order payments and any operations-approved refunds will appear here.")
            } else walletEntries.forEach { entry ->
                Card(colors = CardDefaults.cardColors(containerColor = Color.White), shape = RoundedCornerShape(17.dp), modifier = Modifier.fillMaxWidth()) {
                    Row(Modifier.fillMaxWidth().padding(14.dp), verticalAlignment = Alignment.CenterVertically) {
                        Box(Modifier.size(38.dp).clip(CircleShape).background(if (entry.amountPaise >= 0) Color(0xFFE7F6EF) else PaleBlue), contentAlignment = Alignment.Center) {
                            Icon(if (entry.amountPaise >= 0) Icons.Filled.Add else Icons.Filled.Remove, null, tint = if (entry.amountPaise >= 0) Green else Blue)
                        }
                        Column(Modifier.weight(1f).padding(start = 10.dp)) {
                            Text(entry.title, fontWeight = FontWeight.Bold, color = Ink, fontSize = 12.sp)
                            Text(formatDate(entry.createdAt), color = Muted, fontSize = 10.sp)
                        }
                        Column(horizontalAlignment = Alignment.End) {
                            Text((if (entry.amountPaise >= 0) "+" else "−") + money(kotlin.math.abs(entry.amountPaise)),
                                color = if (entry.amountPaise >= 0) Green else Navy, fontWeight = FontWeight.ExtraBold, fontSize = 13.sp)
                            Text("Bal. " + money(entry.balancePaise), color = Muted, fontSize = 10.sp)
                        }
                    }
                }
            }
            Text("Demo wallet only. Test credits are stored on this phone and have no cash value.", color = Muted, fontSize = 10.sp, lineHeight = 15.sp)
        }
        Spacer(Modifier.height(6.dp))
    }
}

@Composable
private fun ProfileScreen(
    profile: CustomerProfile,
    onProfileChange: (CustomerProfile) -> Unit,
    onSave: () -> Unit,
    onOpenMap: () -> Unit,
    onComplaint: (String) -> Unit,
) {
    var complaint by rememberSaveable { mutableStateOf("") }
    var showAddAddress by rememberSaveable { mutableStateOf(false) }
    var newLabel by rememberSaveable { mutableStateOf("") }
    var newDoor by rememberSaveable { mutableStateOf("") }
    var newStreet by rememberSaveable { mutableStateOf("") }
    var newArea by rememberSaveable { mutableStateOf("") }
    var newLandmark by rememberSaveable { mutableStateOf("") }
    var newCity by rememberSaveable { mutableStateOf("Chennai") }
    var newPincode by rememberSaveable { mutableStateOf("") }

    Column(
        Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(horizontal = 18.dp, vertical = 14.dp),
        verticalArrangement = Arrangement.spacedBy(15.dp),
    ) {
        BrandHeader("PERSONAL DETAILS", "Your profile", "Contact details and up to four saved addresses.")
        Card(colors = CardDefaults.cardColors(containerColor = Color.White), shape = RoundedCornerShape(22.dp), modifier = Modifier.fillMaxWidth()) {
            Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Filled.AccountCircle, null, tint = Blue, modifier = Modifier.size(27.dp))
                    Text("Contact information", fontWeight = FontWeight.ExtraBold, color = Navy, modifier = Modifier.padding(start = 9.dp))
                }
                AppTextField("Full name", profile.name, { onProfileChange(profile.copy(name = it)) })
                Column(verticalArrangement = Arrangement.spacedBy(5.dp)) {
                    Text("Verified mobile number", color = Muted, fontSize = 10.sp, fontWeight = FontWeight.SemiBold)
                    Text("+91 ${profile.phone}", color = Navy, fontSize = 15.sp, fontWeight = FontWeight.Bold)
                    Text(
                        if (profile.phoneVerified) "✓ Verified with SMS OTP"
                        else "Sign in again to verify your mobile number.",
                        color = if (profile.phoneVerified) Green else Muted,
                        fontSize = 11.sp,
                    )
                    Text("To change this number, contact Spencer's support to re-verify your account.", color = Muted, fontSize = 10.sp)
                }
            }
        }

        SectionHeading("Saved addresses", "${profile.savedAddresses.size.coerceAtLeast(if (profile.address.isNotBlank()) 1 else 0)} of 4 addresses")
        if (profile.savedAddresses.isNotEmpty()) {
            profile.savedAddresses.forEach { address ->
                val selected = address.id == profile.selectedAddressId
                Card(
                    colors = CardDefaults.cardColors(containerColor = if (selected) PaleBlue else Color.White),
                    shape = RoundedCornerShape(17.dp),
                    modifier = Modifier.fillMaxWidth().clickable { onProfileChange(profile.withAddress(address)) },
                    border = if (selected) androidx.compose.foundation.BorderStroke(1.dp, Blue) else null,
                ) {
                    Row(Modifier.fillMaxWidth().padding(13.dp), verticalAlignment = Alignment.CenterVertically) {
                        Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                            Text(address.label, color = Navy, fontWeight = FontWeight.ExtraBold, fontSize = 13.sp)
                            Text(address.displayAddress, color = Muted, fontSize = 10.sp, lineHeight = 15.sp)
                        }
                        if (selected) {
                            Text("Selected", color = Blue, fontSize = 10.sp, fontWeight = FontWeight.ExtraBold)
                        } else TextButton(onClick = { onProfileChange(profile.withAddress(address)) }) { Text("Use", color = Blue) }
                    }
                }
            }
        } else {
            Text("No saved address yet. Add your first address below.", color = Muted, fontSize = 11.sp)
        }

        if (profile.savedAddresses.size < 4) {
            OutlinedButton(onClick = { showAddAddress = true }, modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(13.dp)) {
                Icon(Icons.Filled.Add, null, tint = Blue)
                Text("Add address", modifier = Modifier.padding(start = 7.dp))
            }
        }

        Card(colors = CardDefaults.cardColors(containerColor = Color.White), shape = RoundedCornerShape(22.dp), modifier = Modifier.fillMaxWidth()) {
            Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(11.dp)) {
                Text("Selected address", color = Navy, fontWeight = FontWeight.ExtraBold, fontSize = 15.sp)
                AppTextField("Address name (Home / Work / Mother's home)", profile.addressLabel, { onProfileChange(profile.copy(addressLabel = it)) })
                OutlinedButton(onClick = onOpenMap, modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(13.dp)) {
                    Icon(Icons.Filled.LocationOn, contentDescription = null, tint = Blue)
                    Text("Choose this address on map", modifier = Modifier.padding(start = 8.dp), fontWeight = FontWeight.Bold)
                }
                Text("Pin: %.5f, %.5f".format(Locale.US, profile.latitude, profile.longitude), color = Muted, fontSize = 10.sp)
                AppTextField("Door / flat number", profile.door, { onProfileChange(profile.copy(door = it)) })
                AppTextField("Street / road", profile.street, { onProfileChange(profile.copy(street = it)) })
                AppTextField("Area / locality", profile.area, { onProfileChange(profile.copy(area = it)) })
                AppTextField("Landmark (optional)", profile.landmark, { onProfileChange(profile.copy(landmark = it)) })
                AppTextField("City", profile.city, { onProfileChange(profile.copy(city = it)) })
                AppTextField("6-digit pincode", profile.pincode, { onProfileChange(profile.copy(pincode = it.filter(Char::isDigit).take(6))) }, KeyboardType.Number)
                Button(
                    onClick = onSave,
                    enabled = profile.isReady,
                    modifier = Modifier.fillMaxWidth().height(52.dp),
                    shape = RoundedCornerShape(15.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = Navy),
                ) {
                    Icon(Icons.Filled.CheckCircle, null)
                    Text("Save profile and address", fontWeight = FontWeight.ExtraBold, modifier = Modifier.padding(start = 8.dp))
                }
                Text(
                    if (profile.isReady) "Name, verified mobile, city, pincode and delivery address are complete."
                    else "Complete your name, verified mobile, door, street, area, city and 6-digit pincode.",
                    color = if (profile.isReady) Green else Muted, fontSize = 10.sp, lineHeight = 15.sp,
                )
            }
        }

        Card(colors = CardDefaults.cardColors(containerColor = Color.White), shape = RoundedCornerShape(22.dp), modifier = Modifier.fillMaxWidth()) {
            Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Text("Complaint / Support", color = Navy, fontWeight = FontWeight.ExtraBold, fontSize = 15.sp)
                Text("Describe your issue. Submit opens your share sheet so you can send it through email or WhatsApp.", color = Muted, fontSize = 11.sp, lineHeight = 16.sp)
                OutlinedTextField(
                    value = complaint,
                    onValueChange = { complaint = it },
                    label = { Text("Write your complaint") },
                    modifier = Modifier.fillMaxWidth(),
                    minLines = 4,
                    maxLines = 6,
                    shape = RoundedCornerShape(13.dp),
                )
                Button(
                    onClick = { onComplaint(complaint.trim()); complaint = "" },
                    enabled = complaint.trim().length >= 5,
                    modifier = Modifier.fillMaxWidth().height(50.dp),
                    shape = RoundedCornerShape(14.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = Navy),
                ) { Text("Submit complaint") }
                Text("A local ticket reference is saved on this phone. It reaches the support team only after you choose and send it from an email or messaging app.", color = Muted, fontSize = 10.sp, lineHeight = 15.sp)
            }
        }
        Spacer(Modifier.height(8.dp))
    }

    if (showAddAddress) {
        AlertDialog(
            onDismissRequest = { showAddAddress = false },
            title = { Text("Add a saved address") },
            text = {
                Column(Modifier.heightIn(max = 520.dp).verticalScroll(rememberScrollState()), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    AppTextField("Address name (Home / Work / Mother's home)", newLabel, { newLabel = it })
                    AppTextField("Door / flat number", newDoor, { newDoor = it })
                    AppTextField("Street / road", newStreet, { newStreet = it })
                    AppTextField("Area / locality", newArea, { newArea = it })
                    AppTextField("Landmark", newLandmark, { newLandmark = it })
                    AppTextField("City", newCity, { newCity = it })
                    AppTextField("6-digit pincode", newPincode, { newPincode = it.filter(Char::isDigit).take(6) }, KeyboardType.Number)
                    Text("After adding, select this address and use the map button to pin the doorstep.", color = Muted, fontSize = 10.sp)
                }
            },
            confirmButton = {
                TextButton(
                    enabled = newLabel.isNotBlank() && newDoor.isNotBlank() && newStreet.isNotBlank() &&
                        newArea.isNotBlank() && newCity.isNotBlank() && newPincode.length == 6,
                    onClick = {
                        val address = SavedAddress(
                            "addr-" + System.currentTimeMillis(), newLabel.trim(), newDoor.trim(), newStreet.trim(),
                            newArea.trim(), newLandmark.trim(), newCity.trim(), newPincode,
                            profile.latitude, profile.longitude,
                        )
                        onProfileChange(profile.withAddress(address))
                        showAddAddress = false
                        newLabel = ""; newDoor = ""; newStreet = ""; newArea = ""; newLandmark = ""
                        newCity = "Chennai"; newPincode = ""
                    },
                ) { Text("Save address") }
            },
            dismissButton = { TextButton(onClick = { showAddAddress = false }) { Text("Cancel") } },
        )
    }
}

@Composable
private fun LoginScreen(
    onRequestOtp: suspend (String) -> String,
    onVerify: suspend (String, String, String) -> Boolean,
) {
    val scope = rememberCoroutineScope()
    var name by rememberSaveable { mutableStateOf("") }
    var phone by rememberSaveable { mutableStateOf("") }
    var otp by rememberSaveable { mutableStateOf("") }
    var requested by rememberSaveable { mutableStateOf(false) }
    var sending by rememberSaveable { mutableStateOf(false) }
    var verifying by rememberSaveable { mutableStateOf(false) }
    var successMessage by rememberSaveable { mutableStateOf("") }
    var error by rememberSaveable { mutableStateOf("") }
    Column(
        Modifier.fillMaxSize().background(Paper).verticalScroll(rememberScrollState()).padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center,
    ) {
        Image(
            painter = painterResource(id = R.drawable.spencers_logo),
            contentDescription = "Spencers Enterprises",
            modifier = Modifier.width(240.dp).height(190.dp),
            contentScale = ContentScale.Fit,
        )
        Text("Login to continue", color = Navy, fontSize = 24.sp, fontWeight = FontWeight.ExtraBold)
        Text("Enter your mobile number. We will send a one-time password by SMS.", color = Muted, fontSize = 12.sp)
        Spacer(Modifier.height(18.dp))
        AppTextField("Your name", name, { name = it })
        Spacer(Modifier.height(9.dp))
        AppTextField("10-digit mobile number", phone, {
            phone = it.filter(Char::isDigit).take(10)
            requested = false
            otp = ""
            successMessage = ""
            error = ""
        }, KeyboardType.Phone)
        if (!requested) {
            Button(
                onClick = {
                    scope.launch {
                        sending = true
                        error = ""
                        successMessage = ""
                        try {
                            successMessage = onRequestOtp(phone)
                            requested = true
                        } catch (e: Exception) {
                            error = e.message ?: "Could not send OTP. Please try again."
                        } finally {
                            sending = false
                        }
                    }
                },
                enabled = name.isNotBlank() && phone.length == 10 && !sending,
                modifier = Modifier.fillMaxWidth().padding(top = 12.dp).height(52.dp),
                shape = RoundedCornerShape(14.dp),
                colors = ButtonDefaults.buttonColors(containerColor = Navy),
            ) {
                Text(if (sending) "Sending OTP…" else "Send OTP")
            }
        } else {
            Text("OTP sent to +91 $phone. It expires in 5 minutes.", color = Green, fontSize = 11.sp,
                modifier = Modifier.padding(top = 10.dp), fontWeight = FontWeight.SemiBold)
            AppTextField("Enter 6-digit OTP", otp, { otp = it.filter(Char::isDigit).take(6); error = "" }, KeyboardType.Number)
            Button(
                onClick = {
                    scope.launch {
                        verifying = true
                        error = ""
                        try {
                            onVerify(name, phone, otp)
                        } catch (e: Exception) {
                            error = e.message ?: "OTP verification failed. Please try again."
                        } finally {
                            verifying = false
                        }
                    }
                },
                enabled = otp.length == 6 && !verifying,
                modifier = Modifier.fillMaxWidth().padding(top = 10.dp).height(52.dp),
                shape = RoundedCornerShape(14.dp),
                colors = ButtonDefaults.buttonColors(containerColor = Navy),
            ) { Text(if (verifying) "Verifying…" else "Verify and login") }
            TextButton(onClick = { requested = false; otp = ""; error = ""; successMessage = "" }, enabled = !verifying) {
                Text("Change number / resend")
            }
        }
        if (error.isNotBlank()) Text(error, color = Color(0xFFB91C1C), fontSize = 11.sp, modifier = Modifier.padding(top = 8.dp))
        Text("Your mobile number is used for sign-in and order updates.", color = Muted, fontSize = 10.sp, lineHeight = 15.sp,
            modifier = Modifier.padding(top = 12.dp))
    }
}

@Composable
private fun BrandHeader(kicker: String, title: String, subtitle: String) {
    Row(verticalAlignment = Alignment.CenterVertically) {
        Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(4.dp)) {
            Text(kicker, color = Blue, fontWeight = FontWeight.ExtraBold, letterSpacing = 1.3.sp, fontSize = 9.sp)
            Text(title, color = Navy, fontWeight = FontWeight.ExtraBold, fontSize = 24.sp, lineHeight = 29.sp)
            Text(subtitle, color = Muted, fontSize = 11.sp)
        }
        BrandMark(46.dp, animate = true)
    }
}

@Composable
private fun BrandMark(size: Dp, onDark: Boolean = false, animate: Boolean = false) {
    val transition = androidx.compose.animation.core.rememberInfiniteTransition(label = "spencers-original-logo")
    val angle by transition.animateFloat(-3.5f, 3.5f,
        animationSpec = androidx.compose.animation.core.infiniteRepeatable(
            androidx.compose.animation.core.tween(1900, easing = androidx.compose.animation.core.FastOutSlowInEasing),
            repeatMode = androidx.compose.animation.core.RepeatMode.Reverse,
        ), label = "logo-tilt")
    Image(
        painter = painterResource(id = R.drawable.spencers_mark),
        contentDescription = "Spencer's Enterprises original logo",
        modifier = Modifier.size(size).graphicsLayer { rotationZ = if (animate) angle else 0f }
            .clip(RoundedCornerShape(size * .24f)),
        contentScale = ContentScale.Fit,
    )
}

@Composable
private fun SectionHeading(title: String, subtitle: String) {
    Column(verticalArrangement = Arrangement.spacedBy(3.dp)) {
        Text(title, color = Navy, fontWeight = FontWeight.ExtraBold, fontSize = 17.sp)
        Text(subtitle, color = Muted, fontSize = 11.sp)
    }
}

@Composable
private fun RoundAction(icon: androidx.compose.ui.graphics.vector.ImageVector, description: String, enabled: Boolean = true, onClick: () -> Unit) {
    Surface(Modifier.size(43.dp).clip(CircleShape).clickable(enabled = enabled, onClick = onClick),
        color = if (enabled) Navy else Line, shape = CircleShape) {
        Box(contentAlignment = Alignment.Center) { Icon(icon, description, tint = if (enabled) Color.White else Muted) }
    }
}

@Composable
private fun SelectableRow(title: String, subtitle: String, selected: Boolean, enabled: Boolean = true, onClick: () -> Unit) {
    Row(Modifier.fillMaxWidth().clip(RoundedCornerShape(16.dp)).background(if (selected) PaleBlue else Color.White)
        .border(1.dp, if (selected) Blue else Line, RoundedCornerShape(16.dp)).clickable(enabled = enabled, onClick = onClick)
        .padding(horizontal = 13.dp, vertical = 11.dp), verticalAlignment = Alignment.CenterVertically) {
        Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(3.dp)) {
            Text(title, color = if (enabled) Navy else Muted, fontSize = 12.sp, fontWeight = FontWeight.Bold)
            Text(subtitle, color = Muted, fontSize = 10.sp)
        }
        Box(Modifier.size(19.dp).clip(CircleShape).background(if (selected) Blue else Color.Transparent)
            .border(1.dp, if (selected) Blue else Line, CircleShape), contentAlignment = Alignment.Center) {
            if (selected) Text("✓", color = Color.White, fontSize = 11.sp, fontWeight = FontWeight.Black)
        }
    }
}

@Composable
private fun InnerTab(label: String, selected: Boolean, modifier: Modifier = Modifier, onClick: () -> Unit) {
    Surface(modifier.clip(RoundedCornerShape(12.dp)).clickable(onClick = onClick),
        shape = RoundedCornerShape(12.dp), color = if (selected) Navy else Color.Transparent) {
        Box(Modifier.padding(vertical = 10.dp), contentAlignment = Alignment.Center) {
            Text(label, color = if (selected) Color.White else Muted, fontWeight = FontWeight.Bold, fontSize = 12.sp)
        }
    }
}

@Composable
private fun EmptyState(emoji: String, title: String, body: String) {
    Card(colors = CardDefaults.cardColors(containerColor = Color.White), shape = RoundedCornerShape(21.dp), modifier = Modifier.fillMaxWidth()) {
        Column(Modifier.fillMaxWidth().padding(23.dp), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Text(emoji, fontSize = 29.sp)
            Text(title, color = Navy, fontSize = 15.sp, fontWeight = FontWeight.ExtraBold)
            Text(body, color = Muted, fontSize = 11.sp, lineHeight = 17.sp)
        }
    }
}

@Composable
private fun AppTextField(label: String, value: String, onValueChange: (String) -> Unit, keyboardType: KeyboardType = KeyboardType.Text) {
    OutlinedTextField(value, onValueChange, label = { Text(label) }, modifier = Modifier.fillMaxWidth(),
        singleLine = true, shape = RoundedCornerShape(13.dp), keyboardOptions = KeyboardOptions(keyboardType = keyboardType))
}

private fun loadProfile(prefs: SharedPreferences): CustomerProfile {
    val name = prefs.getString("profile_name", "").orEmpty()
    val phone = prefs.getString("profile_phone", "").orEmpty()
    val door = prefs.getString("profile_door", "").orEmpty()
    val street = prefs.getString("profile_street", "").orEmpty()
    val area = prefs.getString("profile_area", "").orEmpty()
    val landmark = prefs.getString("profile_landmark", "").orEmpty()
    val city = prefs.getString("profile_city", "Chennai").orEmpty().ifBlank { "Chennai" }
    val pincode = prefs.getString("profile_pincode", "").orEmpty()
    val label = prefs.getString("profile_address_label", "Home").orEmpty().ifBlank { "Home" }
    val latitude = prefs.getFloat("profile_latitude", 13.0003f).toDouble()
    val longitude = prefs.getFloat("profile_longitude", 80.2668f).toDouble()
    val addresses = try {
        val array = JSONArray(prefs.getString("profile_saved_addresses", "[]"))
        (0 until array.length()).map { i ->
            val item = array.getJSONObject(i)
            SavedAddress(
                item.optString("id"), item.optString("label", "Home"), item.optString("door"),
                item.optString("street"), item.optString("area"), item.optString("landmark"),
                item.optString("city", "Chennai"), item.optString("pincode"),
                item.optDouble("latitude", latitude), item.optDouble("longitude", longitude),
            )
        }.takeLast(4)
    } catch (_: Exception) { emptyList() }
    val migrated = if (addresses.isEmpty() && (door.isNotBlank() || street.isNotBlank() || area.isNotBlank())) {
        listOf(SavedAddress("home", label, door, street, area, landmark, city, pincode, latitude, longitude))
    } else addresses
    return CustomerProfile(
        name = name, phone = phone, door = door, street = street, area = area,
        landmark = landmark, city = city, pincode = pincode, addressLabel = label,
        latitude = latitude, longitude = longitude,
        phoneVerified = prefs.getBoolean("profile_phone_verified", false),
        savedAddresses = migrated,
        selectedAddressId = prefs.getString("profile_selected_address_id", migrated.firstOrNull()?.id ?: "").orEmpty(),
    )
}

private fun loadOrders(prefs: SharedPreferences): List<CustomerOrder> = try {
    val array = JSONArray(prefs.getString("orders", "[]"))
    (0 until array.length()).map { i ->
        val item = array.getJSONObject(i)
        CustomerOrder(
            id = item.optString("id"),
            createdAt = item.optLong("createdAt"),
            quantity = item.optInt("quantity"),
            slot = item.optString("slot"),
            payment = item.optString("payment"),
            totalPaise = item.optInt("totalPaise"),
            status = item.optString("status", "Order placed"),
            partnerName = item.optString("partnerName"),
            partnerPhone = item.optString("partnerPhone"),
            deliveryOtp = item.optString("deliveryOtp"),
            addressLabel = item.optString("addressLabel"),
            deliveryAddress = item.optString("deliveryAddress"),
            refundApplied = item.optBoolean("refundApplied", false),
        )
    }.sortedByDescending { it.createdAt }
} catch (_: Exception) { emptyList() }

private fun saveOrders(prefs: SharedPreferences, orders: List<CustomerOrder>) {
    val array = JSONArray()
    orders.forEach { order ->
        array.put(JSONObject().apply {
            put("id", order.id); put("createdAt", order.createdAt); put("quantity", order.quantity)
            put("slot", order.slot); put("payment", order.payment); put("totalPaise", order.totalPaise)
            put("status", order.status); put("partnerName", order.partnerName); put("partnerPhone", order.partnerPhone)
            put("deliveryOtp", order.deliveryOtp); put("addressLabel", order.addressLabel)
            put("deliveryAddress", order.deliveryAddress); put("refundApplied", order.refundApplied)
        })
    }
    prefs.edit().putString("orders", array.toString()).apply()
}

private fun loadWallet(prefs: SharedPreferences): List<WalletTransaction> = try {
    val array = JSONArray(prefs.getString("wallet_entries", "[]"))
    (0 until array.length()).map { i ->
        val item = array.getJSONObject(i)
        WalletTransaction(item.optString("id"), item.optLong("createdAt"), item.optString("title"),
            item.optInt("amountPaise"), item.optInt("balancePaise"))
    }.sortedByDescending { it.createdAt }
} catch (_: Exception) { emptyList() }

private fun saveWallet(prefs: SharedPreferences, entries: List<WalletTransaction>) {
    val array = JSONArray()
    entries.forEach { entry ->
        array.put(JSONObject().apply {
            put("id", entry.id); put("createdAt", entry.createdAt); put("title", entry.title)
            put("amountPaise", entry.amountPaise); put("balancePaise", entry.balancePaise)
        })
    }
    prefs.edit().putString("wallet_entries", array.toString()).apply()
}

private fun nativeApiRequest(
    path: String,
    method: String,
    body: JSONObject? = null,
    bearerToken: String? = null,
): JSONObject {
    val base = BuildConfig.API_BASE_URL.trimEnd('/')
    val connection = (java.net.URL(base + path).openConnection() as java.net.HttpURLConnection).apply {
        requestMethod = method
        connectTimeout = 12000
        readTimeout = 15000
        doInput = true
        setRequestProperty("Accept", "application/json")
        if (body != null) {
            doOutput = true
            setRequestProperty("Content-Type", "application/json; charset=utf-8")
        }
        if (!bearerToken.isNullOrBlank()) {
            setRequestProperty("Authorization", "Bearer $bearerToken")
        }
    }
    try {
        if (body != null) {
            connection.outputStream.use { output ->
                output.write(body.toString().toByteArray(Charsets.UTF_8))
            }
        }
        val status = connection.responseCode
        val stream = if (status in 200..299) connection.inputStream else connection.errorStream
        val text = stream?.bufferedReader(Charsets.UTF_8)?.use { it.readText() }.orEmpty()
        val response = try { if (text.isBlank()) JSONObject() else JSONObject(text) } catch (_: Exception) { JSONObject() }
        if (status !in 200..299 || response.optBoolean("ok", status in 200..299).not()) {
            throw IllegalStateException(response.optString("error").ifBlank { "Server request failed ($status)." })
        }
        return response
    } finally {
        connection.disconnect()
    }
}

private fun shareMessage(context: Context, subject: String, message: String) {
    val send = Intent(Intent.ACTION_SEND).apply {
        type = "text/plain"
        putExtra(Intent.EXTRA_SUBJECT, subject)
        putExtra(Intent.EXTRA_TEXT, message)
    }
    try {
        context.startActivity(Intent.createChooser(send, "Share using email or WhatsApp"))
    } catch (_: Exception) {
        android.widget.Toast.makeText(context, "No email or messaging app is available on this device.", android.widget.Toast.LENGTH_LONG).show()
    }
}

private fun money(paise: Int): String {
    val format = NumberFormat.getCurrencyInstance(Locale("en", "IN"))
    format.maximumFractionDigits = 2
    format.minimumFractionDigits = 0
    return format.format(paise / 100.0)
}

private fun formatDate(timestamp: Long): String {
    val format = SimpleDateFormat("dd MMM yyyy · hh:mm a", Locale("en", "IN"))
    format.timeZone = TimeZone.getTimeZone("Asia/Kolkata")
    return format.format(Date(timestamp))
}
