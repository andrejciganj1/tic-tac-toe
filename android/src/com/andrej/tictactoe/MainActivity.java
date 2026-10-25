package com.andrej.tictactoe;
import android.app.Activity; import android.os.Bundle; import android.webkit.WebView; import android.graphics.Color;
public class MainActivity extends Activity {
  protected void onCreate(Bundle b){ super.onCreate(b);
    getWindow().setStatusBarColor(Color.parseColor("#111111"));
    WebView w=new WebView(this); w.setBackgroundColor(Color.parseColor("#111111"));
    w.getSettings().setJavaScriptEnabled(true); w.loadUrl("file:///android_asset/index.html"); setContentView(w);}
}
