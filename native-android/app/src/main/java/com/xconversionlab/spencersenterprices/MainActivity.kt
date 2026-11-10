package com.xconversionlab.spencersenterprices

import android.content.Context
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
import androidx.compose.foundation.Canvas
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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.launch
import org.json.JSONArray
import org.json.JSONObject
import java.text.NumberFormat
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.TimeZone

private val Navy = Color(0xFF07172E)
private val Blue = Color(0xFF168DE5)
private val Paper = Color(0xFFF4F7FB)
private val Ink = Color(0xFF14243A)
private val Muted = Color(0xFF6B7A90)
private val Line = Color(0xFFDCE5F0)
private val PaleBlue = Color(0xFFEAF3FC)
private val Green = Color(0xFF16845A)
private const val PRICE_PER_EGG_PAISE = 700
private const val PREFS_NAME = "spencers_native_customer"

private enum class MainTab(val label: String) { Order("Order"), Activity("History & Wallet"), Profile("Profile") }

private data class CustomerProfile(
    val name: String = "",
    val phone: String = "",
    val door: String = "",
    val street: String = "",
    val area: String = "",
    val landmark: String = "",
) {
    val isReady: Boolean get() = name.isNotBlank() && phone.filter(Char::isDigit).length == 10 &&
        door.isNotBlank() && street.isNotBlank() && area.isNotBlank()
    val address: String get() = listOf(door, street, area, "Chennai").filter { it.isNotBlank() }.joinToString(", ")
}

private data class CustomerOrder(
    val id: String, val createdAt: Long, val quantity: Int, val slot: String,
    val payment: String, val totalPaise: Int, val status: String,
)

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
    var orders by remember { mutableStateOf(loadOrders(prefs)) }
    var walletBalance by remember { mutableIntStateOf(prefs.getInt("wallet_balance", 0)) }
    var walletEntries by remember { mutableStateOf(loadWallet(prefs)) }
    var quantity by rememberSaveable { mutableIntStateOf(12) }
    var slot by rememberSaveable { mutableStateOf("Morning · 7:30–9:30 AM") }
    var payment by rememberSaveable { mutableStateOf("Cash on delivery") }
    var showTopUp by remember { mutableStateOf(false) }

    fun saveProfile(next: CustomerProfile) {
        profile = next
        prefs.edit().putString("profile_name", next.name).putString("profile_phone", next.phone)
            .putString("profile_door", next.door).putString("profile_street", next.street)
            .putString("profile_area", next.area).putString("profile_landmark", next.landmark).apply()
    }
    fun updateWallet(nextBalance: Int, entry: WalletTransaction) {
        walletBalance = nextBalance
        walletEntries = listOf(entry) + walletEntries
        prefs.edit().putInt("wallet_balance", nextBalance).apply()
        saveWallet(prefs, walletEntries)
    }
    fun placeOrder() {
        if (!profile.isReady) {
            tab = MainTab.Profile
            scope.launch { snackbar.showSnackbar("Complete your name, 10-digit phone number and delivery address first.") }
            return
        }
        val total = quantity * PRICE_PER_EGG_PAISE
        if (payment == "Wallet" && walletBalance < total) {
            tab = MainTab.Activity
            historyPage = "wallet"
            scope.launch { snackbar.showSnackbar("Your wallet balance is not enough. Add demo funds or choose another payment method.") }
            return
        }
        val now = System.currentTimeMillis()
        val orderId = "SP-" + SimpleDateFormat("yyMMdd-HHmmss", Locale.US).format(Date(now))
        val placed = CustomerOrder(orderId, now, quantity, slot, payment, total, "Order placed")
        orders = listOf(placed) + orders
        saveOrders(prefs, orders)
        if (payment == "Wallet") {
            val next = walletBalance - total
            updateWallet(next, WalletTransaction("TX-" + orderId, now, "Payment for " + orderId, -total, next))
        }
        quantity = 12
        payment = "Cash on delivery"
        tab = MainTab.Activity
        historyPage = "orders"
        scope.launch { snackbar.showSnackbar("Order " + orderId + " placed successfully.") }
    }

    Scaffold(
        containerColor = Paper,
        snackbarHost = { SnackbarHost(snackbar) },
        bottomBar = {
            NavigationBar(containerColor = Color.White, tonalElevation = 10.dp) {
                NavigationBarItem(tab == MainTab.Order, { tab = MainTab.Order }, icon = { Icon(Icons.Filled.ShoppingBasket, null) }, label = { Text("Order") })
                NavigationBarItem(tab == MainTab.Activity, { tab = MainTab.Activity }, icon = { Icon(Icons.Filled.History, null) }, label = { Text("History & Wallet", maxLines = 1) })
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
                MainTab.Order -> OrderScreen(profile, quantity, { quantity = it.coerceIn(1, 360) }, slot, { slot = it },
                    payment, { payment = it }, walletBalance, ::placeOrder, { tab = MainTab.Profile })
                MainTab.Activity -> ActivityScreen(historyPage, { historyPage = it }, orders, walletBalance, walletEntries, { showTopUp = true })
                MainTab.Profile -> ProfileScreen(profile, { profile = it }, { saveProfile(profile); scope.launch { snackbar.showSnackbar("Profile saved on this device.") } })
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
    profile: CustomerProfile, quantity: Int, onQuantityChange: (Int) -> Unit,
    slot: String, onSlotChange: (String) -> Unit,
    payment: String, onPaymentChange: (String) -> Unit,
    walletBalance: Int, onPlaceOrder: () -> Unit, onOpenProfile: () -> Unit,
) {
    val total = quantity * PRICE_PER_EGG_PAISE
    Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(horizontal = 18.dp, vertical = 14.dp),
        verticalArrangement = Arrangement.spacedBy(15.dp)) {
        BrandHeader("SPENCERS ENTERPRICES", "Fresh eggs, delivered", "Farm-fresh essentials at your doorstep.")
        Card(colors = CardDefaults.cardColors(containerColor = Navy), shape = RoundedCornerShape(25.dp), modifier = Modifier.fillMaxWidth()) {
            Row(Modifier.fillMaxWidth().padding(18.dp), verticalAlignment = Alignment.CenterVertically) {
                Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    Text("FRESH EVERY MORNING", color = Color(0xFF8DCFFF), fontSize = 10.sp, fontWeight = FontWeight.ExtraBold, letterSpacing = 1.4.sp)
                    Text("Good eggs. Simple ordering.", color = Color.White, fontSize = 20.sp, fontWeight = FontWeight.ExtraBold)
                    Text("Choose your quantity and delivery window.", color = Color.White.copy(alpha = .74f), fontSize = 12.sp, lineHeight = 18.sp)
                }
                BrandMark(70.dp, onDark = true, animate = true)
            }
        }
        SectionHeading("Your order", "One product · quantity your way")
        Card(colors = CardDefaults.cardColors(containerColor = Color.White), shape = RoundedCornerShape(23.dp),
            elevation = CardDefaults.cardElevation(defaultElevation = 1.dp), modifier = Modifier.fillMaxWidth()) {
            Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(13.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(13.dp)) {
                    Box(Modifier.size(60.dp).clip(RoundedCornerShape(18.dp)).background(PaleBlue), contentAlignment = Alignment.Center) { Text("🥚", fontSize = 30.sp) }
                    Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(3.dp)) {
                        Text("Farm Fresh Egg", fontWeight = FontWeight.ExtraBold, fontSize = 17.sp, color = Navy)
                        Text("Clean, carefully handled everyday eggs.", color = Muted, fontSize = 11.sp)
                        Text(money(PRICE_PER_EGG_PAISE) + " per egg", color = Blue, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                    }
                }
                Divider(color = Line)
                Text("Select quantity", fontWeight = FontWeight.Bold, color = Ink, fontSize = 13.sp)
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                    RoundAction(Icons.Filled.Remove, "Reduce quantity", quantity > 1) { onQuantityChange(quantity - 1) }
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text(quantity.toString(), fontSize = 27.sp, fontWeight = FontWeight.ExtraBold, color = Navy)
                        Text(if (quantity == 1) "egg" else "eggs", fontSize = 11.sp, color = Muted)
                    }
                    RoundAction(Icons.Filled.Add, "Add quantity") { onQuantityChange(quantity + 1) }
                }
                Row(Modifier.fillMaxWidth().horizontalScroll(rememberScrollState()), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    listOf(6, 12, 30, 60, 120).forEach { value ->
                        FilterChip(selected = quantity == value, onClick = { onQuantityChange(value) }, label = { Text(value.toString()) })
                    }
                }
                Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                    Text("Total", color = Muted, fontWeight = FontWeight.SemiBold)
                    Spacer(Modifier.weight(1f))
                    Text(money(total), color = Navy, fontSize = 23.sp, fontWeight = FontWeight.ExtraBold)
                }
            }
        }
        SectionHeading("Delivery window", "Choose when it should arrive")
        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            listOf("Dawn · 5:30–7:30 AM", "Morning · 7:30–9:30 AM", "Late morning · 9:30–11:30 AM").forEach { option ->
                SelectableRow(option, if (option.startsWith("Dawn")) "Early drop" else if (option.startsWith("Morning")) "Popular choice" else "Later delivery", slot == option) { onSlotChange(option) }
            }
        }
        SectionHeading("Payment", "Choose how you want to pay")
        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            SelectableRow("Cash on delivery", "Pay when your eggs arrive", payment == "Cash on delivery") { onPaymentChange("Cash on delivery") }
            SelectableRow("UPI · demo", "Test checkout only. No money is transferred.", payment == "UPI · demo") { onPaymentChange("UPI · demo") }
            SelectableRow("Wallet", "Available balance: " + money(walletBalance), payment == "Wallet", walletBalance >= total) { onPaymentChange("Wallet") }
        }
        Card(colors = CardDefaults.cardColors(containerColor = Color.White), shape = RoundedCornerShape(19.dp), modifier = Modifier.fillMaxWidth()) {
            Column(Modifier.padding(15.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Filled.LocationOn, null, tint = Blue)
                    Text("Delivery address", fontWeight = FontWeight.Bold, color = Navy, modifier = Modifier.padding(start = 7.dp))
                    Spacer(Modifier.weight(1f))
                    TextButton(onClick = onOpenProfile) { Text(if (profile.isReady) "Edit" else "Add", color = Blue) }
                }
                if (profile.isReady) {
                    Text(profile.name, fontWeight = FontWeight.Bold, color = Ink)
                    Text(profile.address, color = Muted, fontSize = 12.sp, lineHeight = 18.sp)
                    Text("+91 " + profile.phone, color = Muted, fontSize = 12.sp)
                } else {
                    Text("Add your delivery details in Profile before placing an order.", color = Muted, fontSize = 12.sp)
                    OutlinedButton(onClick = onOpenProfile, modifier = Modifier.fillMaxWidth()) { Text("Complete profile") }
                }
            }
        }
        Button(onClick = onPlaceOrder, modifier = Modifier.fillMaxWidth().height(55.dp), shape = RoundedCornerShape(17.dp),
            colors = ButtonDefaults.buttonColors(containerColor = Navy)) {
            Text("Place order · " + money(total), fontWeight = FontWeight.ExtraBold, fontSize = 15.sp)
            Icon(Icons.Filled.ArrowForward, null, modifier = Modifier.padding(start = 9.dp))
        }
        Text("Demo build: orders and profile are stored on this device. Online payment is not connected.",
            Modifier.fillMaxWidth().padding(bottom = 8.dp), color = Muted, fontSize = 10.sp, lineHeight = 15.sp)
    }
}

@Composable
private fun ActivityScreen(
    page: String, onPageChange: (String) -> Unit, orders: List<CustomerOrder>,
    walletBalance: Int, walletEntries: List<WalletTransaction>, onAddFunds: () -> Unit,
) {
    Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(horizontal = 18.dp, vertical = 14.dp),
        verticalArrangement = Arrangement.spacedBy(15.dp)) {
        BrandHeader("YOUR ACCOUNT", "History & Wallet", "Everything related to your orders and balance.")
        Row(Modifier.fillMaxWidth().clip(RoundedCornerShape(15.dp)).background(Color.White).padding(4.dp), horizontalArrangement = Arrangement.spacedBy(4.dp)) {
            InnerTab("Order history", page == "orders", Modifier.weight(1f)) { onPageChange("orders") }
            InnerTab("Wallet", page == "wallet", Modifier.weight(1f)) { onPageChange("wallet") }
        }
        if (page == "orders") {
            SectionHeading("Your orders", orders.size.toString() + " order(s) on this device")
            if (orders.isEmpty()) EmptyState("🧺", "No orders yet", "Your placed orders will appear here.")
            else orders.forEach { order ->
                Card(colors = CardDefaults.cardColors(containerColor = Color.White), shape = RoundedCornerShape(20.dp),
                    modifier = Modifier.fillMaxWidth(), elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)) {
                    Column(Modifier.padding(15.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Column(Modifier.weight(1f)) {
                                Text(order.id, fontWeight = FontWeight.ExtraBold, color = Navy)
                                Text(formatDate(order.createdAt), color = Muted, fontSize = 10.sp)
                            }
                            Surface(color = PaleBlue, shape = RoundedCornerShape(50)) {
                                Text(order.status, color = Blue, fontWeight = FontWeight.Bold, fontSize = 10.sp, modifier = Modifier.padding(horizontal = 9.dp, vertical = 6.dp))
                            }
                        }
                        Divider(color = Line)
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(order.quantity.toString() + " eggs · " + order.slot, color = Ink, fontSize = 12.sp, modifier = Modifier.weight(1f))
                            Text(money(order.totalPaise), color = Navy, fontWeight = FontWeight.ExtraBold, fontSize = 16.sp)
                        }
                        Text(when (order.payment) {
                            "UPI · demo" -> "Payment: UPI demo (not charged)"
                            "Wallet" -> "Paid from wallet"
                            else -> "Payment: Cash on delivery"
                        }, color = Muted, fontSize = 11.sp)
                    }
                }
            }
        } else {
            Card(colors = CardDefaults.cardColors(containerColor = Navy), shape = RoundedCornerShape(24.dp), modifier = Modifier.fillMaxWidth()) {
                Column(Modifier.padding(19.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Filled.Wallet, null, tint = Color(0xFF8DCFFF))
                        Text("SPENCERS WALLET", color = Color.White.copy(alpha = .72f), fontSize = 10.sp, fontWeight = FontWeight.ExtraBold, letterSpacing = 1.4.sp, modifier = Modifier.padding(start = 8.dp))
                    }
                    Text(money(walletBalance), color = Color.White, fontSize = 32.sp, fontWeight = FontWeight.ExtraBold)
                    Text("Available balance", color = Color.White.copy(alpha = .7f), fontSize = 12.sp)
                    Button(onClick = onAddFunds, modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(13.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = Color.White, contentColor = Navy)) { Text("Add demo funds", fontWeight = FontWeight.Bold) }
                }
            }
            Text("Transactions", fontWeight = FontWeight.ExtraBold, color = Navy, fontSize = 17.sp)
            if (walletEntries.isEmpty()) EmptyState("💳", "No wallet activity", "Wallet top-ups and wallet order payments will appear here.")
            else walletEntries.forEach { entry ->
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
            Text("Demo wallet only. Added funds are test credits stored on this device and have no cash value.", color = Muted, fontSize = 10.sp, lineHeight = 15.sp)
        }
        Spacer(Modifier.height(6.dp))
    }
}

@Composable
private fun ProfileScreen(profile: CustomerProfile, onProfileChange: (CustomerProfile) -> Unit, onSave: () -> Unit) {
    Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(horizontal = 18.dp, vertical = 14.dp),
        verticalArrangement = Arrangement.spacedBy(15.dp)) {
        BrandHeader("PERSONAL DETAILS", "Your profile", "Keep your delivery details up to date.")
        Card(colors = CardDefaults.cardColors(containerColor = Color.White), shape = RoundedCornerShape(22.dp), modifier = Modifier.fillMaxWidth()) {
            Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Filled.AccountCircle, null, tint = Blue, modifier = Modifier.size(27.dp))
                    Text("Contact information", fontWeight = FontWeight.ExtraBold, color = Navy, modifier = Modifier.padding(start = 9.dp))
                }
                AppTextField("Full name", profile.name, { onProfileChange(profile.copy(name = it)) })
                AppTextField("Mobile number", profile.phone, { onProfileChange(profile.copy(phone = it.filter(Char::isDigit).take(10))) }, KeyboardType.Phone)
                Divider(color = Line)
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Filled.LocationOn, null, tint = Blue, modifier = Modifier.size(24.dp))
                    Text("Delivery address · Chennai", fontWeight = FontWeight.ExtraBold, color = Navy, modifier = Modifier.padding(start = 9.dp))
                }
                AppTextField("Door / flat number", profile.door, { onProfileChange(profile.copy(door = it)) })
                AppTextField("Street / road", profile.street, { onProfileChange(profile.copy(street = it)) })
                AppTextField("Area / locality", profile.area, { onProfileChange(profile.copy(area = it)) })
                AppTextField("Landmark (optional)", profile.landmark, { onProfileChange(profile.copy(landmark = it)) })
                Button(onClick = onSave, enabled = profile.isReady, modifier = Modifier.fillMaxWidth().height(52.dp),
                    shape = RoundedCornerShape(15.dp), colors = ButtonDefaults.buttonColors(containerColor = Navy)) {
                    Icon(Icons.Filled.CheckCircle, null)
                    Text("Save profile", fontWeight = FontWeight.ExtraBold, modifier = Modifier.padding(start = 8.dp))
                }
                Text(if (profile.isReady) "Your details are ready. Tap Save profile to store them on this phone."
                    else "Enter your name, valid 10-digit phone number, door number, street and area to place an order.",
                    color = if (profile.isReady) Green else Muted, fontSize = 10.sp, lineHeight = 15.sp)
            }
        }
        Text("Update these details whenever your delivery address changes.", color = Muted, fontSize = 11.sp)
        Spacer(Modifier.height(8.dp))
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
    val transition = androidx.compose.animation.core.rememberInfiniteTransition(label = "spencers-mark")
    val angle by transition.animateFloat(-4f, 4f,
        animationSpec = androidx.compose.animation.core.infiniteRepeatable(
            androidx.compose.animation.core.tween(1800, easing = androidx.compose.animation.core.FastOutSlowInEasing),
            repeatMode = androidx.compose.animation.core.RepeatMode.Reverse,
        ), label = "mark-tilt")
    Box(Modifier.size(size).graphicsLayer { rotationZ = if (animate) angle else 0f }
        .clip(RoundedCornerShape(size * .31f)).background(if (onDark) Color.White.copy(alpha = .12f) else Navy)
        .border(1.dp, if (onDark) Color.White.copy(alpha = .2f) else Color.Transparent, RoundedCornerShape(size * .31f)),
        contentAlignment = Alignment.Center) {
        Canvas(Modifier.fillMaxSize().padding(size * .16f)) { drawOval(color = Color.White.copy(alpha = .98f)) }
        Text("S", color = Blue, fontSize = (size.value * .42f).sp, fontWeight = FontWeight.Black)
    }
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

private fun loadProfile(prefs: SharedPreferences) = CustomerProfile(
    name = prefs.getString("profile_name", "").orEmpty(),
    phone = prefs.getString("profile_phone", "").orEmpty(),
    door = prefs.getString("profile_door", "").orEmpty(),
    street = prefs.getString("profile_street", "").orEmpty(),
    area = prefs.getString("profile_area", "").orEmpty(),
    landmark = prefs.getString("profile_landmark", "").orEmpty(),
)

private fun loadOrders(prefs: SharedPreferences): List<CustomerOrder> = try {
    val array = JSONArray(prefs.getString("orders", "[]"))
    (0 until array.length()).map { i ->
        val item = array.getJSONObject(i)
        CustomerOrder(item.optString("id"), item.optLong("createdAt"), item.optInt("quantity"),
            item.optString("slot"), item.optString("payment"), item.optInt("totalPaise"), item.optString("status", "Order placed"))
    }.sortedByDescending { it.createdAt }
} catch (_: Exception) { emptyList() }

private fun saveOrders(prefs: SharedPreferences, orders: List<CustomerOrder>) {
    val array = JSONArray()
    orders.forEach { order ->
        array.put(JSONObject().apply {
            put("id", order.id); put("createdAt", order.createdAt); put("quantity", order.quantity)
            put("slot", order.slot); put("payment", order.payment); put("totalPaise", order.totalPaise); put("status", order.status)
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
