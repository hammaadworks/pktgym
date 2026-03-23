#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use std::sync::Arc;
use tokio::sync::broadcast;
use tokio::net::TcpListener;
use futures_util::{StreamExt, SinkExt};
use local_ip_address::local_ip;

#[tauri::command]
fn get_local_ip() -> String {
    match local_ip() {
        Ok(ip) => format!("ws://{}:8899", ip),
        Err(_) => "ws://localhost:8899".to_string(),
    }
}

async fn run_websocket_server(tx: broadcast::Sender<String>) {
    let addr = "0.0.0.0:8899";
    let listener = TcpListener::bind(&addr).await.expect("Failed to bind WebSocket port");
    println!("WebSocket server listening on: {}", addr);

    while let Ok((stream, _)) = listener.accept().await {
        let tx = tx.clone();
        tokio::spawn(async move {
            let ws_stream = tokio_tungstenite::accept_async(stream)
                .await
                .expect("Error during the websocket handshake occurred");

            let (mut write, mut read) = ws_stream.split();
            let mut rx = tx.subscribe();

            // Handle incoming messages (from mobile)
            let tx_clone = tx.clone();
            tokio::spawn(async move {
                while let Some(message) = read.next().await {
                    if let Ok(msg) = message {
                        if msg.is_text() || msg.is_binary() {
                            let msg_str = msg.to_string();
                            let _ = tx_clone.send(msg_str);
                        }
                    }
                }
            });

            // Handle outgoing messages (to mobile)
            tokio::spawn(async move {
                while let Ok(msg) = rx.recv().await {
                    let _ = write.send(tokio_tungstenite::tungstenite::Message::Text(msg)).await;
                }
            });
        });
    }
}

fn main() {
    let (tx, _rx) = broadcast::channel(100);
    
    // Start WebSocket server in background
    let tx_clone = tx.clone();
    tauri::async_runtime::spawn(async move {
        run_websocket_server(tx_clone).await;
    });

    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![get_local_ip])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}