package com.dibsonthename.brighteyes

import android.Manifest
import android.annotation.SuppressLint
import android.content.ContentResolver
import android.content.ContentValues
import android.content.pm.ActivityInfo
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.provider.MediaStore
import android.util.Base64
import android.util.Log
import android.webkit.*
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.result.ActivityResultLauncher
import androidx.activity.result.contract.ActivityResultContracts
import androidx.annotation.RequiresApi
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import java.lang.Exception
import java.text.SimpleDateFormat
import java.util.*
import java.util.Base64.getDecoder


class MainActivity : AppCompatActivity() {
    private var cameraLauncher: ActivityResultLauncher<String>? = null

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        val webView: WebView = findViewById(R.id.webview)
        val webSettings = webView.settings
        webSettings.javaScriptEnabled = true
        webSettings.mediaPlaybackRequiresUserGesture = false
        webSettings.builtInZoomControls = true
        webSettings.displayZoomControls = false
        webSettings.useWideViewPort = true
        webSettings.loadWithOverviewMode = true

        webView.webViewClient = object : WebViewClient() {
            @RequiresApi(Build.VERSION_CODES.M)
            override fun onReceivedError(
                view: WebView?,
                request: WebResourceRequest?,
                error: WebResourceError
            ) {
                Toast.makeText(
                    applicationContext,
                    "BrightEyes error " + error.description,
                    Toast.LENGTH_LONG
                ).show()
            }
        }

        webView.webChromeClient = object : WebChromeClient() {
            @RequiresApi(Build.VERSION_CODES.LOLLIPOP)
            override fun onPermissionRequest(request: PermissionRequest) {
                request.grant(request.resources)
            }

            override fun onConsoleMessage(message: ConsoleMessage): Boolean {
                Log.d("BrightEyes", "${message.message()} -- from " +
                        "${message.sourceId()}:${message.lineNumber()}")
                return true
            }
        }

        webView.setDownloadListener(object : DownloadListener {
            @RequiresApi(Build.VERSION_CODES.O)
            @SuppressLint("SimpleDateFormat")
            override fun onDownloadStart(
                url: String?,
                userAgent: String?,
                contentDisposition: String?,
                mimetype: String?,
                contentLength: Long
            ) {
                url?.let { url ->
                    val data: ByteArray = getDecoder().decode(url.substring(url.indexOf(",") + 1))

                    val timeStamp = SimpleDateFormat("yyyy-MM-dd HH.mm.ss.SSS").format(Date())
                    val name = "BrightEyes capture $timeStamp.png"

                    saveImage(data, "DCIM/BrightEyes", name, "image/png")
                }
            }
        })

        cameraLauncher =
            (this as ComponentActivity).registerForActivityResult(
                ActivityResultContracts.RequestPermission()
            ) { isGranted: Boolean ->
                if (isGranted) {
                    runCamera()
                }
                else {
                    displayHtml("<html><body>Could not get camera permission</body></html>")
                }
            }
    }

    fun saveImage(data: ByteArray, directory: String, filename: String, mimeType: String) {
        Log.d("BrightEyes","Saving $filename of type $mimeType to $directory")
        val values = ContentValues().apply {
            put(MediaStore.MediaColumns.DISPLAY_NAME, filename)
            put(MediaStore.MediaColumns.MIME_TYPE, mimeType)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                put(MediaStore.MediaColumns.RELATIVE_PATH, directory)
            }
        }

        val resolver: ContentResolver = applicationContext.contentResolver

        val uri = resolver.insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, values)
        uri?.let { uri ->
            try {
                resolver.openOutputStream(uri)?.use {
                    it.write(data)
                }
            } catch (e: Exception) {
                resolver.delete(uri, null, null)
                throw e
            }
        }
    }

    private fun getCameraPermission() {
        val currentPermission = ContextCompat.checkSelfPermission(
            applicationContext, Manifest.permission.CAMERA)
        if (currentPermission == PackageManager.PERMISSION_GRANTED) {
            runCamera()
        }
        else {
            cameraLauncher?.launch(Manifest.permission.CAMERA)
        }
    }

    private fun displayHtml(html: String) {
        val webView: WebView = findViewById(R.id.webview)
        val encodedHtml = Base64.encodeToString(html.toByteArray(), Base64.NO_PADDING)
        webView.loadData(encodedHtml, "text/html", "base64")
    }

    override fun onStart() {
        super.onStart()

        displayHtml("<html><body>Getting camera permission ...</body></html>")

        getCameraPermission()
    }

    override fun onStop() {
        displayHtml("<html><body>Stopped</body></html>")

        super.onStop()
    }

    private fun runCamera() {
        val webView: WebView = findViewById(R.id.webview)

        requestedOrientation = ActivityInfo.SCREEN_ORIENTATION_NOSENSOR

        Log.d("BrightEyes", "${webView.width},${webView.height},webView")
        webView.loadUrl("file:///android_asset/index.html")
    }
}