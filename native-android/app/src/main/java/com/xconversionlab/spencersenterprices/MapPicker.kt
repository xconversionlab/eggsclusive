package com.xconversionlab.spencersenterprices

import android.Manifest
import android.annotation.SuppressLint
import android.content.Context
import android.content.pm.PackageManager
import android.graphics.BitmapFactory
import android.location.Geocoder
import android.location.Location
import android.location.LocationManager
import android.os.Build
import android.os.Looper
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.gestures.detectDragGestures
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.MyLocation
import androidx.compose.material.icons.filled.Remove
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.ImageBitmap
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.ContextCompat
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.File
import java.net.HttpURLConnection
import java.net.URL
import java.util.Locale
import kotlin.math.PI
import kotlin.math.atan
import kotlin.math.ceil
import kotlin.math.floor
import kotlin.math.ln
import kotlin.math.pow
import kotlin.math.sinh

private data class MapPoint(val lat: Double, val lng: Double)
private data class TileSpec(val url: String, val left: Float, val top: Float)

data class ReverseGeocodedAddress(
    val street: String,
    val area: String,
    val city: String,
    val fullAddress: String,
)

private fun project(point: MapPoint, zoom: Int): Pair<Double, Double> {
    val scale = 256.0 * 2.0.pow(zoom.toDouble())
    val latitude = point.lat.coerceIn(-85.05112878, 85.05112878)
    val sin = kotlin.math.sin(latitude * PI / 180.0)
    val x = ((point.lng + 180.0) / 360.0) * scale
    val y = (0.5 - ln((1.0 + sin) / (1.0 - sin)) / (4.0 * PI)) * scale
    return x to y
}

private fun unproject(x: Double, y: Double, zoom: Int): MapPoint {
    val scale = 256.0 * 2.0.pow(zoom.toDouble())
    val lng = (x / scale) * 360.0 - 180.0
    val n = PI - (2.0 * PI * y) / scale
    val lat = (180.0 / PI) * atan(sinh(n))
    return MapPoint(lat.coerceIn(-85.05112878, 85.05112878), lng.coerceIn(-180.0, 180.0))
}

private fun visibleTiles(center: MapPoint, zoom: Int, widthDp: Float, heightDp: Float): List<TileSpec> {
    val (centerX, centerY) = project(center, zoom)
    val leftWorld = centerX - widthDp / 2.0
    val topWorld = centerY - heightDp / 2.0
    val firstX = floor(leftWorld / 256.0).toInt()
    val firstY = floor(topWorld / 256.0).toInt()
    val columns = ceil(widthDp / 256.0).toInt() + 1
    val rows = ceil(heightDp / 256.0).toInt() + 1
    val count = 2.0.pow(zoom.toDouble()).toInt()
    val result = mutableListOf<TileSpec>()
    for (row in 0 until rows) {
        for (column in 0 until columns) {
            val rawX = firstX + column
            val y = firstY + row
            if (y < 0 || y >= count) continue
            val x = ((rawX % count) + count) % count
            result += TileSpec(
                url = "https://tile.openstreetmap.org/$zoom/$x/$y.png",
                left = (rawX * 256.0 - leftWorld).toFloat(),
                top = (y * 256.0 - topWorld).toFloat(),
            )
        }
    }
    return result
}

@Composable
private fun MapTile(url: String, left: Float, top: Float) {
    val context = LocalContext.current
    var bitmap by remember(url) { mutableStateOf<ImageBitmap?>(null) }
    LaunchedEffect(url) {
        bitmap = loadTile(context, url)
    }
    if (bitmap != null) {
        Image(
            bitmap = bitmap!!,
            contentDescription = null,
            modifier = Modifier.offset(x = left.dp, y = top.dp).size(256.dp),
        )
    } else {
        Box(Modifier.offset(x = left.dp, y = top.dp).size(256.dp).background(Color(0xFFE6EDF2)))
    }
}

private suspend fun loadTile(context: Context, url: String): ImageBitmap? = withContext(Dispatchers.IO) {
    val cacheDir = File(context.cacheDir, "openstreetmap-tiles").apply { mkdirs() }
    val fileName = url.substringAfterLast('/').removeSuffix(".png").let { segment ->
        val parts = url.removeSuffix(".png").split("/")
        parts.takeLast(3).joinToString("_") + "_" + segment + ".png"
    }
    val cached = File(cacheDir, fileName)
    val isFresh = cached.exists() && System.currentTimeMillis() - cached.lastModified() < 7L * 24 * 60 * 60 * 1000
    if (!isFresh) {
        try {
            val connection = (URL(url).openConnection() as HttpURLConnection).apply {
                connectTimeout = 8000
                readTimeout = 10000
                setRequestProperty("User-Agent", "SpencersEnterprices-Android/1.0")
                setRequestProperty("Accept", "image/png")
                setRequestProperty("Accept-Encoding", "identity")
            }
            connection.inputStream.use { input ->
                val temp = File(cacheDir, "$fileName.tmp")
                temp.outputStream().use { output -> input.copyTo(output) }
                if (temp.length() > 0) {
                    if (cached.exists()) cached.delete()
                    temp.renameTo(cached)
                }
            }
            connection.disconnect()
        } catch (_: Exception) {
            // Use a previously cached tile when the device is offline.
        }
    }
    BitmapFactory.decodeFile(cached.absolutePath)?.asImageBitmap()
}

@Composable
fun MapPickerScreen(
    initialLatitude: Double,
    initialLongitude: Double,
    onCancel: () -> Unit,
    onConfirm: (Double, Double) -> Unit,
) {
    val context = LocalContext.current
    val hasSavedPin = initialLatitude != 0.0 || initialLongitude != 0.0
    var center by remember {
        mutableStateOf(
            if (hasSavedPin) MapPoint(initialLatitude, initialLongitude)
            else MapPoint(20.5937, 78.9629),
        )
    }
    var zoom by remember { mutableIntStateOf(16) }
    var locating by remember { mutableStateOf(false) }
    var message by remember {
        mutableStateOf(
            if (hasSavedPin) ""
            else "Use my location or move the map pin to your delivery address.",
        )
    }

    fun acceptLocation(location: Location?) {
        locating = false
        if (location == null) {
            message = "Could not get your location. Drag the map pin to select it manually."
        } else {
            center = MapPoint(location.latitude, location.longitude)
            message = "Your current location is pinned. Drag the map to fine-tune it."
        }
    }

    @SuppressLint("MissingPermission")
    fun locateWithPermission() {
        try {
            val manager = context.getSystemService(Context.LOCATION_SERVICE) as LocationManager
            val fine = ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED
            val provider = if (fine && manager.isProviderEnabled(LocationManager.GPS_PROVIDER)) {
                LocationManager.GPS_PROVIDER
            } else if (manager.isProviderEnabled(LocationManager.NETWORK_PROVIDER)) {
                LocationManager.NETWORK_PROVIDER
            } else {
                null
            }
            if (provider == null) {
                acceptLocation(null)
                return
            }
            val last = manager.getLastKnownLocation(provider)
            if (last != null) {
                acceptLocation(last)
            } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                manager.getCurrentLocation(provider, null, context.mainExecutor) { acceptLocation(it) }
            } else {
                manager.requestSingleUpdate(provider, { acceptLocation(it) }, Looper.getMainLooper())
            }
        } catch (_: SecurityException) {
            acceptLocation(null)
        } catch (_: Exception) {
            acceptLocation(null)
        }
    }

    val permissionLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions(),
    ) { grants ->
        if (grants.values.any { it }) locateWithPermission()
        else {
            locating = false
            message = "Location permission was not granted. You can still move the map pin manually."
        }
    }

    Column(Modifier.fillMaxSize().background(Paper).padding(horizontal = 16.dp, vertical = 12.dp)) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            IconButton(onClick = onCancel) {
                Icon(Icons.Filled.ArrowBack, contentDescription = "Back", tint = Navy)
            }
            Column(Modifier.weight(1f)) {
                Text("DELIVERY LOCATION", color = Blue, fontWeight = FontWeight.ExtraBold, fontSize = 9.sp, letterSpacing = 1.5.sp)
                Text("Pin your doorstep", color = Navy, fontWeight = FontWeight.ExtraBold, fontSize = 21.sp)
            }
        }
        Text("Move the map until the pin is exactly at your entrance.", color = Muted, fontSize = 12.sp)
        Spacer(Modifier.height(12.dp))

        BoxWithConstraints(
            Modifier.fillMaxWidth().weight(1f).clip(RoundedCornerShape(23.dp)).background(Color(0xFFE6EDF2)),
        ) {
            val tiles = remember(center, zoom, maxWidth, maxHeight) {
                visibleTiles(center, zoom, maxWidth.value, maxHeight.value)
            }
            Box(
                Modifier.fillMaxSize().pointerInput(zoom) {
                    detectDragGestures { change, drag ->
                        change.consume()
                        val current = center
                        val (worldX, worldY) = project(current, zoom)
                        center = unproject(worldX - drag.x / density, worldY - drag.y / density, zoom)
                    }
                },
            ) {
                tiles.forEach { tile ->
                    MapTile(tile.url, tile.left, tile.top)
                }
                Column(
                    Modifier.align(Alignment.Center).offset(y = (-18).dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                ) {
                    Icon(Icons.Filled.LocationOn, contentDescription = "Delivery pin", tint = Color(0xFF087FCE), modifier = Modifier.size(47.dp))
                    Surface(color = Navy.copy(alpha = .94f), shape = RoundedCornerShape(50)) {
                        Text("DELIVER HERE", color = Color.White, fontSize = 9.sp, fontWeight = FontWeight.ExtraBold,
                            letterSpacing = 1.sp, modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp))
                    }
                }
                Column(
                    Modifier.align(Alignment.TopEnd).padding(10.dp).clip(RoundedCornerShape(13.dp))
                        .background(Color.White.copy(alpha = .96f)).border(1.dp, Line, RoundedCornerShape(13.dp)),
                ) {
                    IconButton(onClick = { zoom = (zoom + 1).coerceAtMost(19) }) { Icon(Icons.Filled.Add, "Zoom in", tint = Navy) }
                    Divider(color = Line)
                    IconButton(onClick = { zoom = (zoom - 1).coerceAtLeast(12) }) { Icon(Icons.Filled.Remove, "Zoom out", tint = Navy) }
                }
                Surface(
                    Modifier.align(Alignment.BottomEnd).padding(7.dp),
                    color = Color.White.copy(alpha = .92f),
                    shape = RoundedCornerShape(5.dp),
                ) {
                    Text("© OpenStreetMap contributors", fontSize = 9.sp, color = Ink, modifier = Modifier.padding(horizontal = 7.dp, vertical = 4.dp))
                }
            }
        }

        Spacer(Modifier.height(10.dp))
        Text("Pin: %.5f, %.5f".format(Locale.US, center.lat, center.lng), color = Muted, fontSize = 11.sp)
        if (message.isNotBlank()) {
            Text(message, color = Blue, fontSize = 11.sp, modifier = Modifier.padding(top = 6.dp))
        }
        Spacer(Modifier.height(10.dp))
        OutlinedButton(
            onClick = {
                locating = true
                message = "Finding your current location…"
                val fine = ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED
                val coarse = ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED
                if (fine || coarse) locateWithPermission()
                else permissionLauncher.launch(arrayOf(Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION))
            },
            enabled = !locating,
            modifier = Modifier.fillMaxWidth().height(48.dp),
            shape = RoundedCornerShape(14.dp),
        ) {
            Icon(Icons.Filled.MyLocation, contentDescription = null, tint = Blue)
            Text(if (locating) "Locating…" else "Use my location", modifier = Modifier.padding(start = 8.dp), fontWeight = FontWeight.Bold)
        }
        Spacer(Modifier.height(8.dp))
        Button(
            onClick = { onConfirm(center.lat, center.lng) },
            modifier = Modifier.fillMaxWidth().height(53.dp),
            shape = RoundedCornerShape(15.dp),
            colors = ButtonDefaults.buttonColors(containerColor = Navy),
        ) { Text("Confirm delivery location", fontWeight = FontWeight.ExtraBold) }
    }
}

suspend fun reverseGeocodeLocation(context: Context, latitude: Double, longitude: Double): ReverseGeocodedAddress? =
    withContext(Dispatchers.IO) {
        if (!Geocoder.isPresent()) return@withContext null
        try {
            @Suppress("DEPRECATION")
            val result = Geocoder(context, Locale("en", "IN")).getFromLocation(latitude, longitude, 1)
            val address = result?.firstOrNull() ?: return@withContext null
            val street = address.thoroughfare ?: address.subThoroughfare ?: address.featureName.orEmpty()
            val area = address.subLocality ?: address.locality ?: address.subAdminArea.orEmpty()
            val city = address.locality ?: address.subAdminArea ?: address.adminArea.orEmpty()
            ReverseGeocodedAddress(street, area, city, address.getAddressLine(0).orEmpty())
        } catch (_: Exception) {
            null
        }
    }
