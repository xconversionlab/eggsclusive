package com.xconversionlab.spencersvendor

import android.content.Context
import android.os.Bundle
import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import android.util.Base64
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Inventory2
import androidx.compose.material.icons.filled.ReceiptLong
import androidx.compose.material.icons.filled.Storefront
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import java.text.NumberFormat
import java.util.Date
import java.text.SimpleDateFormat
import java.util.Locale
import java.security.KeyStore
import javax.crypto.Cipher
import javax.crypto.KeyGenerator
import javax.crypto.SecretKey
import javax.crypto.spec.GCMParameterSpec

private val Navy = Color(0xFF07172E)
private val Blue = Color(0xFF168DE5)
private val Paper = Color(0xFFF4F7FB)
private val Ink = Color(0xFF14243A)
private val Muted = Color(0xFF6B7A90)
private val Line = Color(0xFFDCE5F0)
private val Green = Color(0xFF16845A)
private val Red = Color(0xFFB42318)
private const val PREFS = "spencers_vendor_session"
private const val KEY_ALIAS = "spencers_vendor_session_key"

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
                background = Paper, surface = Color.White, onSurface = Ink, outline = Line,
            )) { VendorApp() }
        }
    }
}

private data class VendorProfile(
    val id: String, val name: String, val phone: String, val status: String,
    val pincodes: List<String>, val accepting: Boolean, val opensAt: String, val closesAt: String,
)
private data class VendorOrder(
    val id: String, val customerName: String, val phone: String, val eggs: Int, val water: Int,
    val milk: Int, val curd: Int, val totalPaise: Int, val paymentMethod: String,
    val paymentStatus: String, val status: String, val address: String, val createdAt: Long,
)
private data class VendorStock(
    val key: String, val units: Int, val lowAt: Int, val available: Boolean,
)
private class ApiException(val statusCode: Int, override val message: String) : Exception(message)

private fun JSONArray?.strings(): List<String> =
    if (this == null) emptyList() else (0 until length()).map { optString(it) }.filter { it.isNotBlank() }

private fun parseVendor(j: JSONObject) = VendorProfile(
    j.optString("id"), j.optString("name"), j.optString("phone"), j.optString("status"),
    j.optJSONArray("servicePincodes").strings(), j.optBoolean("acceptingOrders"),
    j.optString("opensAt", "05:00"), j.optString("closesAt", "14:00"),
)
private fun parseOrder(j: JSONObject) = VendorOrder(
    j.optString("id"), j.optString("customerName"), j.optString("phone"),
    j.optInt("eggQuantity"), j.optInt("waterCanQuantity"), j.optInt("milkQuantity"), j.optInt("curdQuantity"),
    j.optInt("totalPaise"), j.optString("paymentMethod"), j.optString("paymentStatus"), j.optString("status"),
    listOf(j.optString("addressLabel"), j.optString("addressLine"), j.optString("city"), j.optString("pincode"))
        .filter { it.isNotBlank() }.joinToString(", "),
    j.optLong("createdAt"),
)
private fun parseStock(j: JSONObject) = VendorStock(
    j.optString("productKey"), j.optInt("stockUnits"), j.optInt("lowStockAt"), j.optBoolean("available"),
)
private fun money(paise: Int): String {
    val f = NumberFormat.getCurrencyInstance(Locale("en", "IN"))
    f.maximumFractionDigits = 2
    f.minimumFractionDigits = 0
    return f.format(paise / 100.0)
}
private fun dateText(time: Long): String {
    val f = SimpleDateFormat("dd MMM, hh:mm a", Locale("en", "IN"))
    f.timeZone = java.util.TimeZone.getTimeZone("Asia/Kolkata")
    return f.format(Date(time))
}

private fun api(
    path: String, method: String = "GET", body: JSONObject? = null, token: String? = null,
): JSONObject {
    val connection = (URL(BuildConfig.API_BASE_URL.trimEnd('/') + path).openConnection() as HttpURLConnection).apply {
        requestMethod = method
        connectTimeout = 15000
        readTimeout = 18000
        doInput = true
        setRequestProperty("Accept", "application/json")
        setRequestProperty("Cache-Control", "no-store")
        if (body != null) {
            doOutput = true
            setRequestProperty("Content-Type", "application/json; charset=utf-8")
        }
        if (!token.isNullOrBlank()) setRequestProperty("Authorization", "Bearer " + token)
    }
    try {
        if (body != null) connection.outputStream.use { it.write(body.toString().toByteArray(Charsets.UTF_8)) }
        val status = connection.responseCode
        val stream = if (status in 200..299) connection.inputStream else connection.errorStream
        val content = stream?.bufferedReader(Charsets.UTF_8)?.use { it.readText() }.orEmpty()
        val result = try { if (content.isBlank()) JSONObject() else JSONObject(content) } catch (_: Exception) { JSONObject() }
        if (status !in 200..299 || !result.optBoolean("ok", status in 200..299)) {
            throw ApiException(status, result.optString("error").ifBlank { "Request failed (" + status + ")." })
        }
        return result
    } finally { connection.disconnect() }
}

private suspend fun loadDashboard(token: String): Triple<VendorProfile, List<VendorOrder>, List<VendorStock>> =
    withContext(Dispatchers.IO) {
        val session = api("/api/vendor/session", token = token)
        val orders = api("/api/vendor/orders", token = token).optJSONArray("orders") ?: JSONArray()
        val stock = api("/api/vendor/stock", token = token).optJSONArray("stock") ?: JSONArray()
        val vendor = session.optJSONObject("vendor") ?: throw IllegalStateException("Vendor profile missing.")
        Triple(
            parseVendor(vendor),
            (0 until orders.length()).mapNotNull { orders.optJSONObject(it)?.let(::parseOrder) },
            (0 until stock.length()).mapNotNull { stock.optJSONObject(it)?.let(::parseStock) },
        )
    }

private object TokenVault {
    private fun secretKey(): SecretKey {
        val store = KeyStore.getInstance("AndroidKeyStore").apply { load(null) }
        (store.getKey(KEY_ALIAS, null) as? SecretKey)?.let { return it }
        val generator = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, "AndroidKeyStore")
        generator.init(KeyGenParameterSpec.Builder(
            KEY_ALIAS, KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT,
        ).setBlockModes(KeyProperties.BLOCK_MODE_GCM)
            .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
            .setRandomizedEncryptionRequired(true).build())
        return generator.generateKey()
    }
    fun read(context: Context): String {
        val stored = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString("token", null) ?: return ""
        return try {
            val bytes = Base64.decode(stored, Base64.NO_WRAP)
            val cipher = Cipher.getInstance("AES/GCM/NoPadding")
            cipher.init(Cipher.DECRYPT_MODE, secretKey(), GCMParameterSpec(128, bytes.copyOfRange(0, 12)))
            String(cipher.doFinal(bytes.copyOfRange(12, bytes.size)), Charsets.UTF_8)
        } catch (_: Exception) { clear(context); "" }
    }
    fun write(context: Context, token: String) {
        val cipher = Cipher.getInstance("AES/GCM/NoPadding")
        cipher.init(Cipher.ENCRYPT_MODE, secretKey())
        val bytes = cipher.iv + cipher.doFinal(token.toByteArray(Charsets.UTF_8))
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit()
            .putString("token", Base64.encodeToString(bytes, Base64.NO_WRAP)).apply()
    }
    fun clear(context: Context) {
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().clear().apply()
    }
}

@Composable
private fun VendorApp() {
    val context = androidx.compose.ui.platform.LocalContext.current
    val scope = rememberCoroutineScope()
    var token by remember { mutableStateOf(TokenVault.read(context)) }
    var vendor by remember { mutableStateOf<VendorProfile?>(null) }
    var orders by remember { mutableStateOf(emptyList<VendorOrder>()) }
    var stock by remember { mutableStateOf(emptyList<VendorStock>()) }
    var tab by remember { mutableStateOf("orders") }
    var loading by remember { mutableStateOf(token.isNotBlank()) }
    var saving by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf("") }
    var message by remember { mutableStateOf("") }
    var deliveryOrder by remember { mutableStateOf<VendorOrder?>(null) }

    fun refresh() {
        if (token.isBlank()) return
        scope.launch {
            loading = true
            error = ""
            try {
                val data = loadDashboard(token)
                vendor = data.first; orders = data.second; stock = data.third
            } catch (e: Exception) {
                if (e is ApiException && e.statusCode == 401) {
                    TokenVault.clear(context); token = ""; vendor = null
                } else error = e.message ?: "Could not load vendor data."
            } finally { loading = false }
        }
    }
    LaunchedEffect(token) { if (token.isNotBlank()) refresh() }

    fun logout() {
        scope.launch {
            runCatching { withContext(Dispatchers.IO) { api("/api/vendor/logout", "POST", JSONObject(), token) } }
            TokenVault.clear(context); token = ""; vendor = null; orders = emptyList(); stock = emptyList()
        }
    }
    suspend fun updateOrder(order: VendorOrder, status: String, cashCollected: Boolean? = null) {
        saving = true; error = ""
        try {
            withContext(Dispatchers.IO) {
                val body = JSONObject().put("status", status)
                if (cashCollected != null) body.put("cashCollected", cashCollected)
                api("/api/vendor/orders/" + order.id + "/status", "POST", body, token)
            }
            message = when (status) {
                "accepted" -> "Order accepted."
                "preparing" -> "Order moved to packing."
                "out_for_delivery" -> "Order marked out for delivery."
                "delivered" -> "Delivery recorded."
                else -> "Order released for reassignment."
            }
            val data = loadDashboard(token)
            vendor = data.first; orders = data.second; stock = data.third
        } catch (e: Exception) { error = e.message ?: "Could not update order." }
        finally { saving = false }
    }

    if (token.isBlank()) {
        VendorLogin(onSignedIn = { newToken -> TokenVault.write(context, newToken); token = newToken })
        return
    }
    if (vendor == null && loading) {
        Box(Modifier.fillMaxSize().background(Paper), contentAlignment = Alignment.Center) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                CircularProgressIndicator(color = Blue)
                Spacer(Modifier.height(12.dp))
                Text("Connecting to Spencer's Vendor", color = Navy, fontWeight = FontWeight.SemiBold)
            }
        }
        return
    }
    if (vendor == null) {
        Column(Modifier.fillMaxSize().background(Paper).padding(24.dp), verticalArrangement = Arrangement.Center) {
            Text("Vendor access unavailable", color = Navy, fontSize = 24.sp, fontWeight = FontWeight.Bold)
            Text(error.ifBlank { "This account is not approved for vendor access." }, color = Muted)
            Button(onClick = ::refresh) { Text("Try again") }
            TextButton(onClick = ::logout) { Text("Sign out") }
        }
        return
    }

    val profile = vendor!!
    val active = orders.count { it.status in listOf("placed", "accepted", "preparing", "out_for_delivery") }
    val newCount = orders.count { it.status == "placed" }
    val delivered = orders.count { it.status == "delivered" }

    Scaffold(
        containerColor = Paper,
        topBar = {
            Row(
                Modifier.fillMaxWidth().background(Color.White).padding(horizontal = 16.dp, vertical = 12.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Column(Modifier.weight(1f)) {
                    Text("SPENCER'S ENTERPRISES", color = Blue, fontWeight = FontWeight.ExtraBold, fontSize = 10.sp, letterSpacing = 1.5.sp)
                    Text("Vendor", color = Navy, fontWeight = FontWeight.ExtraBold, fontSize = 23.sp)
                    Text(profile.name, color = Muted, fontSize = 12.sp, maxLines = 1)
                }
                TextButton(onClick = ::refresh, enabled = !loading) { Text("Refresh") }
                TextButton(onClick = ::logout) { Text("Sign out") }
            }
        },
        bottomBar = {
            NavigationBar(containerColor = Color.White) {
                NavigationBarItem(tab == "orders", { tab = "orders" }, icon = { Icon(Icons.Filled.ReceiptLong, null) }, label = { Text("Orders") })
                NavigationBarItem(tab == "stock", { tab = "stock" }, icon = { Icon(Icons.Filled.Inventory2, null) }, label = { Text("Stock") })
                NavigationBarItem(tab == "shop", { tab = "shop" }, icon = { Icon(Icons.Filled.Storefront, null) }, label = { Text("Shop") })
            }
        },
    ) { padding ->
        Column(Modifier.fillMaxSize().padding(padding)) {
            if (error.isNotBlank()) Text(error, color = Red, fontSize = 12.sp, modifier = Modifier.padding(horizontal = 14.dp, vertical = 5.dp))
            if (message.isNotBlank()) Text(message, color = Green, fontSize = 12.sp, modifier = Modifier.padding(horizontal = 14.dp, vertical = 4.dp))
            when (tab) {
                "orders" -> OrdersScreen(orders, active, newCount, delivered, saving || loading) { order, status ->
                    if (status == "delivered") deliveryOrder = order
                    else scope.launch { updateOrder(order, status) }
                }
                "stock" -> StockScreen(stock, saving) { row ->
                    scope.launch {
                        saving = true
                        try {
                            val result = withContext(Dispatchers.IO) {
                                api("/api/vendor/stock", "POST",
                                    JSONObject().put("productKey", row.key).put("stockUnits", row.units)
                                        .put("lowStockAt", row.lowAt).put("available", row.available), token)
                            }
                            val arr = result.optJSONArray("stock") ?: JSONArray()
                            stock = (0 until arr.length()).mapNotNull { arr.optJSONObject(it)?.let(::parseStock) }
                            message = "Stock updated."
                        } catch (e: Exception) { error = e.message ?: "Could not save stock." }
                        finally { saving = false }
                    }
                }
                else -> ShopScreen(profile, saving) { accepting, opens, closes ->
                    scope.launch {
                        saving = true
                        try {
                            val result = withContext(Dispatchers.IO) {
                                api("/api/vendor/profile", "POST",
                                    JSONObject().put("acceptingOrders", accepting).put("opensAt", opens).put("closesAt", closes), token)
                            }
                            vendor = result.optJSONObject("vendor")?.let(::parseVendor) ?: profile
                            message = "Shop settings saved."
                        } catch (e: Exception) { error = e.message ?: "Could not save shop settings." }
                        finally { saving = false }
                    }
                }
            }
        }
    }

    deliveryOrder?.let { order ->
        AlertDialog(
            onDismissRequest = { deliveryOrder = null },
            title = { Text("Confirm delivery") },
            text = { Text("Was cash collected for order " + order.id + "? Total: " + money(order.totalPaise)) },
            confirmButton = {
                TextButton(onClick = { deliveryOrder = null; scope.launch { updateOrder(order, "delivered", true) } }) {
                    Text("Cash collected")
                }
            },
            dismissButton = {
                Row {
                    TextButton(onClick = { deliveryOrder = null; scope.launch { updateOrder(order, "delivered", false) } }) { Text("Not collected") }
                    TextButton(onClick = { deliveryOrder = null }) { Text("Back") }
                }
            },
        )
    }
}

@Composable
private fun VendorLogin(onSignedIn: (String) -> Unit) {
    val scope = rememberCoroutineScope()
    var phone by remember { mutableStateOf("") }
    var otp by remember { mutableStateOf("") }
    var requested by remember { mutableStateOf(false) }
    var busy by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf("") }
    var message by remember { mutableStateOf("") }

    Column(
        Modifier.fillMaxSize().background(Paper).verticalScroll(rememberScrollState()).imePadding().padding(22.dp),
        verticalArrangement = Arrangement.Center,
    ) {
        Box(Modifier.size(60.dp).background(Navy, RoundedCornerShape(18.dp)), contentAlignment = Alignment.Center) {
            Text("S", color = Color.White, fontSize = 30.sp, fontWeight = FontWeight.ExtraBold)
        }
        Spacer(Modifier.height(20.dp))
        Text("SPENCER'S ENTERPRISES", color = Blue, fontSize = 11.sp, fontWeight = FontWeight.ExtraBold, letterSpacing = 1.8.sp)
        Text("Vendor App", color = Navy, fontSize = 32.sp, fontWeight = FontWeight.ExtraBold)
        Text("Shop orders, stock and availability.", color = Muted, fontSize = 14.sp)
        Spacer(Modifier.height(22.dp))
        Card(colors = CardDefaults.cardColors(containerColor = Color.White), shape = RoundedCornerShape(22.dp),
            border = androidx.compose.foundation.BorderStroke(1.dp, Line)) {
            Column(Modifier.fillMaxWidth().padding(18.dp), verticalArrangement = Arrangement.spacedBy(11.dp)) {
                Text("Vendor sign in", color = Navy, fontSize = 18.sp, fontWeight = FontWeight.Bold)
                OutlinedTextField(phone, { phone = it.filter(Char::isDigit).take(10) }, Modifier.fillMaxWidth(),
                    label = { Text("10-digit mobile number") }, singleLine = true,
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone))
                if (requested) OutlinedTextField(otp, { otp = it.filter(Char::isDigit).take(6) }, Modifier.fillMaxWidth(),
                    label = { Text("6-digit OTP") }, singleLine = true,
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.NumberPassword))
                Button(
                    onClick = {
                        scope.launch {
                            busy = true; error = ""; message = ""
                            try {
                                if (!requested) {
                                    val response = withContext(Dispatchers.IO) {
                                        api("/api/vendor/auth/request-otp", "POST", JSONObject().put("phone", phone))
                                    }
                                    requested = true
                                    message = response.optString("message", "OTP sent. Check your phone.")
                                } else {
                                    val response = withContext(Dispatchers.IO) {
                                        api("/api/vendor/auth/verify-otp", "POST",
                                            JSONObject().put("phone", phone).put("code", otp))
                                    }
                                    val value = response.optString("token")
                                    if (value.isBlank()) throw IllegalStateException("Vendor session was not returned.")
                                    onSignedIn(value)
                                }
                            } catch (e: Exception) { error = e.message ?: "Could not sign in." }
                            finally { busy = false }
                        }
                    },
                    enabled = !busy && phone.length == 10 && (!requested || otp.length == 6),
                    modifier = Modifier.fillMaxWidth().height(50.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = Navy),
                ) {
                    if (busy) CircularProgressIndicator(Modifier.size(18.dp), color = Color.White, strokeWidth = 2.dp)
                    else Text(if (requested) "Verify & sign in" else "Send OTP", fontWeight = FontWeight.Bold)
                }
                if (requested) TextButton(onClick = { requested = false; otp = "" }) { Text("Change mobile number") }
                if (message.isNotBlank()) Text(message, color = Green, fontSize = 12.sp)
                if (error.isNotBlank()) Text(error, color = Red, fontSize = 12.sp)
            }
        }
        Spacer(Modifier.height(14.dp))
        Text("Only vendor accounts approved by Spencer's platform operations can sign in.", color = Muted, fontSize = 12.sp)
    }
}

@Composable
private fun OrdersScreen(
    orders: List<VendorOrder>, active: Int, fresh: Int, delivered: Int,
    busy: Boolean, onAction: (VendorOrder, String) -> Unit,
) {
    Column(Modifier.fillMaxSize()) {
        Row(Modifier.fillMaxWidth().padding(14.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            Metric("New", fresh.toString(), Modifier.weight(1f))
            Metric("Active", active.toString(), Modifier.weight(1f))
            Metric("Delivered", delivered.toString(), Modifier.weight(1f))
        }
        if (orders.isEmpty()) {
            Column(Modifier.fillMaxWidth().padding(30.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                Text("No assigned orders yet", color = Navy, fontWeight = FontWeight.Bold, fontSize = 18.sp)
                Text("Orders assigned to your shop will appear here.", color = Muted, fontSize = 13.sp)
            }
        } else {
            Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(horizontal = 14.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)) {
                orders.forEach { order ->
                    OrderCard(order, busy, onAction)
                }
                Spacer(Modifier.height(16.dp))
            }
        }
    }
}

@Composable
private fun Metric(label: String, value: String, modifier: Modifier) {
    Card(modifier, colors = CardDefaults.cardColors(containerColor = Color.White),
        border = androidx.compose.foundation.BorderStroke(1.dp, Line), shape = RoundedCornerShape(15.dp)) {
        Column(Modifier.padding(12.dp)) {
            Text(label, color = Muted, fontSize = 11.sp)
            Text(value, color = Navy, fontSize = 24.sp, fontWeight = FontWeight.ExtraBold)
        }
    }
}

@Composable
private fun OrderCard(order: VendorOrder, busy: Boolean, onAction: (VendorOrder, String) -> Unit) {
    Card(colors = CardDefaults.cardColors(containerColor = Color.White), shape = RoundedCornerShape(18.dp),
        border = androidx.compose.foundation.BorderStroke(1.dp, Line)) {
        Column(Modifier.fillMaxWidth().padding(15.dp), verticalArrangement = Arrangement.spacedBy(7.dp)) {
            Text(order.id + "   ·   " + order.status.replace('_', ' ').uppercase(Locale.US),
                color = Blue, fontWeight = FontWeight.Bold, fontSize = 11.sp)
            Text(order.customerName.ifBlank { "Customer" }, color = Navy, fontWeight = FontWeight.Bold, fontSize = 18.sp)
            val products = mutableListOf<String>()
            if (order.eggs > 0) products += "Eggs × " + order.eggs
            if (order.water > 0) products += "Water cans × " + order.water
            if (order.milk > 0) products += "Milk × " + order.milk
            if (order.curd > 0) products += "Curd × " + order.curd
            Text(products.joinToString("  ·  ").ifBlank { "Items unavailable" }, color = Ink, fontSize = 13.sp)
            Text(order.address, color = Muted, fontSize = 12.sp, lineHeight = 17.sp)
            Text("Customer: " + order.phone, color = Muted, fontSize = 12.sp)
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Text(dateText(order.createdAt), color = Muted, fontSize = 11.sp)
                Text(money(order.totalPaise), color = Navy, fontWeight = FontWeight.ExtraBold, fontSize = 17.sp)
            }
            Text("Payment: " + order.paymentMethod.replace('_', ' ') + " · " + order.paymentStatus,
                color = Muted, fontSize = 11.sp)
            when (order.status) {
                "placed" -> Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Button(onClick = { onAction(order, "accepted") }, enabled = !busy, modifier = Modifier.weight(1f),
                        colors = ButtonDefaults.buttonColors(containerColor = Navy)) { Text("Accept") }
                    OutlinedButton(onClick = { onAction(order, "rejected") }, enabled = !busy, modifier = Modifier.weight(1f)) { Text("Decline") }
                }
                "accepted" -> Button(onClick = { onAction(order, "preparing") }, enabled = !busy, modifier = Modifier.fillMaxWidth()) { Text("Start packing") }
                "preparing" -> Button(onClick = { onAction(order, "out_for_delivery") }, enabled = !busy, modifier = Modifier.fillMaxWidth()) { Text("Out for delivery") }
                "out_for_delivery" -> Button(onClick = { onAction(order, "delivered") }, enabled = !busy, modifier = Modifier.fillMaxWidth()) { Text("Mark delivered") }
                "delivered" -> Text("Order completed", color = Green, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                "cancelled" -> Text("Order cancelled", color = Red, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
            }
        }
    }
}

@Composable
private fun StockScreen(stock: List<VendorStock>, busy: Boolean, onSave: (VendorStock) -> Unit) {
    val names = mapOf("egg" to "Eggs", "water" to "Water cans", "milk" to "Milk", "curd" to "Curd")
    Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(15.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Text("Stock & availability", color = Navy, fontWeight = FontWeight.ExtraBold, fontSize = 24.sp)
        Text("Prices remain controlled by Spencer's platform. Update only your available quantities.", color = Muted, fontSize = 12.sp)
        listOf("egg", "water", "milk", "curd").forEach { key ->
            StockEditor(names[key] ?: key, stock.firstOrNull { it.key == key } ?: VendorStock(key, 0, 10, false), busy, onSave)
        }
    }
}

@Composable
private fun StockEditor(label: String, initial: VendorStock, busy: Boolean, onSave: (VendorStock) -> Unit) {
    var units by remember(initial.key, initial.units) { mutableStateOf(initial.units.toString()) }
    var low by remember(initial.key, initial.lowAt) { mutableStateOf(initial.lowAt.toString()) }
    var available by remember(initial.key, initial.available) { mutableStateOf(initial.available) }
    Card(colors = CardDefaults.cardColors(containerColor = Color.White), shape = RoundedCornerShape(17.dp),
        border = androidx.compose.foundation.BorderStroke(1.dp, Line)) {
        Column(Modifier.fillMaxWidth().padding(15.dp), verticalArrangement = Arrangement.spacedBy(9.dp)) {
            Text(label, color = Navy, fontSize = 17.sp, fontWeight = FontWeight.Bold)
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedTextField(units, { units = it.filter(Char::isDigit).take(6) }, Modifier.weight(1f),
                    label = { Text("Units") }, singleLine = true, keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number))
                OutlinedTextField(low, { low = it.filter(Char::isDigit).take(6) }, Modifier.weight(1f),
                    label = { Text("Low stock at") }, singleLine = true, keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number))
            }
            Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                Text("Available for orders", color = Ink, fontSize = 13.sp, modifier = Modifier.weight(1f))
                Switch(available, { available = it })
            }
            Button(onClick = {
                onSave(initial.copy(units = (units.toIntOrNull() ?: 0).coerceIn(0, 100000),
                    lowAt = (low.toIntOrNull() ?: 0).coerceIn(0, 100000), available = available))
            }, enabled = !busy && units.isNotBlank() && low.isNotBlank(), modifier = Modifier.fillMaxWidth()) {
                Text("Save stock")
            }
        }
    }
}

@Composable
private fun ShopScreen(vendor: VendorProfile, busy: Boolean, onSave: (Boolean, String, String) -> Unit) {
    var accepting by remember(vendor.accepting) { mutableStateOf(vendor.accepting) }
    var opens by remember(vendor.opensAt) { mutableStateOf(vendor.opensAt) }
    var closes by remember(vendor.closesAt) { mutableStateOf(vendor.closesAt) }
    Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(15.dp),
        verticalArrangement = Arrangement.spacedBy(13.dp)) {
        Text("Your shop", color = Navy, fontWeight = FontWeight.ExtraBold, fontSize = 24.sp)
        Card(colors = CardDefaults.cardColors(containerColor = Color.White), shape = RoundedCornerShape(17.dp),
            border = androidx.compose.foundation.BorderStroke(1.dp, Line)) {
            Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(7.dp)) {
                Text(vendor.name, color = Navy, fontWeight = FontWeight.Bold, fontSize = 19.sp)
                Text(vendor.phone, color = Muted, fontSize = 13.sp)
                Text("Service pincodes: " + vendor.pincodes.joinToString(", ").ifBlank { "Not configured" }, color = Muted, fontSize = 12.sp)
                Text("Account: " + vendor.status, color = Green, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
            }
        }
        Card(colors = CardDefaults.cardColors(containerColor = Color.White), shape = RoundedCornerShape(17.dp),
            border = androidx.compose.foundation.BorderStroke(1.dp, Line)) {
            Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Text("Shop availability", color = Navy, fontWeight = FontWeight.Bold, fontSize = 17.sp)
                Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                    Text(if (accepting) "Accepting new orders" else "Not accepting new orders",
                        color = Ink, fontSize = 13.sp, modifier = Modifier.weight(1f))
                    Switch(accepting, { accepting = it })
                }
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(opens, { opens = it.take(5) }, Modifier.weight(1f), label = { Text("Opens HH:MM") }, singleLine = true)
                    OutlinedTextField(closes, { closes = it.take(5) }, Modifier.weight(1f), label = { Text("Closes HH:MM") }, singleLine = true)
                }
                Button(onClick = { onSave(accepting, opens, closes) }, enabled = !busy, modifier = Modifier.fillMaxWidth()) {
                    Text("Save shop settings")
                }
            }
        }
    }
}
