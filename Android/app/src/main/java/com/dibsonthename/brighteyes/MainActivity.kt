package com.dibsonthename.brighteyes

import android.content.pm.ActivityInfo
import android.os.Build
import android.os.Bundle
import android.util.Log
import android.webkit.*
import android.widget.Toast
import androidx.annotation.RequiresApi
import androidx.appcompat.app.AppCompatActivity


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
    }

    override fun onStart() {
        super.onStart()

        setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_NOSENSOR);

        val webView: WebView = findViewById(R.id.webview)
        Log.d("BrightEyes", "${webView.width},${webView.height},webView");
        webView.loadUrl("file:///android_asset/index.html");
    }
}