package com.dibsonthename.brighteyes

import android.app.DownloadManager
import android.content.ContentResolver
import android.content.ContentValues
import android.content.Context
import android.content.pm.ActivityInfo
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.Environment
import android.provider.MediaStore
import android.util.Log
import android.webkit.*
import android.widget.Toast
import androidx.annotation.RequiresApi
import androidx.appcompat.app.AppCompatActivity
import java.io.File
import java.io.IOException
import java.lang.Exception
import java.text.SimpleDateFormat
import java.util.*
import java.util.Base64.getDecoder


class MainActivity : AppCompatActivity() {
    @RequiresApi(Build.VERSION_CODES.JELLY_BEAN_MR1)
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        val webView: WebView = findViewById(R.id.webview)
        val webSettings = webView.settings
        webSettings.javaScriptEnabled = true
        webSettings.mediaPlaybackRequiresUserGesture = false
        webSettings.builtInZoomControls = true
        webSettings.displayZoomControls = false
        webView.setInitialScale(100)

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
                    val destination = Environment.DIRECTORY_DCIM + File.separator + "BrightEyes"
                    val name = "BrightEyes capture $timeStamp.png"

                    saveImage(data, destination, name, "image/png")
                }
            }
        });
    }

    fun saveImage(data: ByteArray, directory: String, filename: String, mimeType: String) {

        val values = ContentValues().apply {
            put(MediaStore.MediaColumns.DISPLAY_NAME, filename)
            put(MediaStore.MediaColumns.MIME_TYPE, mimeType)
            put(MediaStore.MediaColumns.RELATIVE_PATH, directory)
        }

        val resolver: ContentResolver = getApplicationContext().getContentResolver()

        val uri = resolver.insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, values);
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

    override fun onStart() {
        super.onStart()

        setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_NOSENSOR);

        val webView: WebView = findViewById(R.id.webview)
        Log.d("BrightEyes", "${webView.width},${webView.height},webView");
        webView.loadUrl("file:///android_asset/index.html");
    }
}