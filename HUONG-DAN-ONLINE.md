# Từ bản offline đến game online

## Trạng thái bản giao
Bản HTML này hoạt động hoàn toàn offline. Ba khách, Top 1, chat tự động, kết bạn và đổi cá là mô phỏng lưu trên thiết bị. Không có tài khoản, kết nối phòng, máy chủ hay cơ sở dữ liệu online. Tài liệu này là lộ trình kỹ thuật để tự phát triển tiếp, không phải backend đã chạy hay mã triển khai đã kiểm thử.

## Kiến trúc đề xuất
Trình duyệt hiển thị sảnh và gửi ý định của người chơi → API xác thực + máy chủ phòng thời gian thực → cơ sở dữ liệu lưu tài khoản, vật phẩm và tiến trình. Máy chủ giữ quyền quyết định tài sản, CP, HP boss, kết quả chiến đấu và bảng xếp hạng. Không lấy số tiền/CP từ trình duyệt làm dữ liệu đáng tin.

1. Tách `lobby.js` thành phần vẽ/UI và bộ kết nối. Giữ các hàm hiển thị hồ sơ, tủ đồ, chat. Thay VISITORS bằng danh sách thành viên phòng từ máy chủ; bỏ trả lời tự động và huy hiệu mô phỏng chỉ sau khi kết nối thật hoạt động.
2. Thêm đăng ký/đăng nhập và phiên đăng nhập có thời hạn. Máy chủ gắn userId vào phiên; không chấp nhận userId tùy ý trong nội dung yêu cầu. Bản TEST tuyệt đối không dùng chung dữ liệu sản xuất.
3. Tạo dữ liệu theo bảng bên dưới, migration có phiên bản, sao lưu và thử phục hồi trước khi mở giao dịch.
4. Viết API hồ sơ, kho đồ, trang bị, bạn bè và xếp hạng. Mọi thay đổi kiểm tra quyền sở hữu phía máy chủ; CP tính lại từ dữ liệu vĩnh viễn bằng cùng phiên bản combat-config.
5. Viết dịch vụ phòng: vào/rời phòng, chụp trạng thái đầu vào, số thứ tự sự kiện, heartbeat, reconnect lấy snapshot mới. Phòng đầu tiên nên giới hạn 12–20 người để đo tải.
6. Đồng bộ di chuyển bằng ý định/đích đến và số thứ tự, khoảng 5–10 cập nhật mỗi giây; trình duyệt nội suy hình ảnh. Máy chủ giới hạn tốc độ, biên bản đồ và tần suất tin. Không ghi mỗi khung hình vào cơ sở dữ liệu.
7. Chat giới hạn 80 ký tự, giới hạn tần suất, có chặn/báo cáo. Render text thay vì HTML. Emote chỉ nhận enum hợp lệ và tự hết hạn.
8. Giao dịch cần đề nghị, hai bên xác nhận cùng một phiên bản, rồi máy chủ đổi quyền sở hữu trong một transaction. Khóa hàng theo thứ tự ID cố định; kiểm tra vật phẩm còn thuộc chủ cũ, chưa bán/khóa ở giao dịch khác; chỉ cập nhật khi đủ hai bên. Có requestId duy nhất để yêu cầu gửi lại không đổi hai lần.
9. Săn boss chung: mỗi phòng giữ HP boss duy nhất. Máy chủ lên lịch đòn người/pet/cá, kiểm tra QTE theo cửa sổ thời gian và độ trễ cho phép. Client gửi thao tác, không gửi số sát thương. Thưởng được phát đúng một lần bằng rewardId duy nhất.
10. Chạy thử ở môi trường thử nghiệm với hai trình duyệt/tài khoản thật, rồi tăng lên nhiều client. Tách địa chỉ dịch vụ và khóa công khai khỏi bí mật; bí mật chỉ nằm phía máy chủ. Bản hiện tại không đọc cấu hình kết nối và không tự gọi mạng.

## Bảng dữ liệu tối thiểu
| Bảng | Nội dung chính | Quyền |
|---|---|---|
| profiles | userId, tên, avatar, cosmetics | Xem công khai; chỉ chủ sửa trường cho phép |
| progression | userId, cấp, tiền, nâng cấp, rebirth, version | Máy chủ ghi |
| owned_items | itemId duy nhất, ownerId, loại, chỉ số, lockedTradeId | Máy chủ ghi; chủ xem |
| friendships | hai userId, pending/accepted/blocked | Hai bên liên quan |
| trades | tradeId, hai bên, revision, trạng thái, hạn | Hai bên xem; máy chủ chuyển trạng thái |
| trade_items | tradeId, itemId, phía gửi | Máy chủ kiểm tra sở hữu |
| reward_ledger | rewardId duy nhất, userId, nguồn, số lượng | Máy chủ ghi |
| leaderboard | userId, CP đã xác minh, season | Xem công khai; máy chủ ghi |

Vị trí hiện tại, emote và HP boss đang đánh giữ trong phòng; ghi checkpoint theo chu kỳ cần thiết. Mọi enum/giới hạn lấy từ cấu hình có phiên bản để client và server cùng quy tắc.

## Hợp đồng sự kiện gợi ý
- Client: room.join {roomId}, move.intent {seq,x,y}, emote.send {id}, chat.send {requestId,text}, friend.request {targetId}, trade.offer {requestId,targetId,itemIds}, trade.confirm {tradeId,revision}, combat.qte {battleId,seq,clientTime}.
- Server: room.snapshot {version,members,boss}, member.joined/left, move.accepted {seq,x,y,serverTime}, chat.created, trade.updated, trade.completed, combat.hit {actorId,targetId,damage,critical,hp,combo,serverTime}.
- Mỗi phản hồi lỗi có code, requestId và trạng thái có thể thử lại. Khi mất mạng, hiện “Mất kết nối”, ngừng giao dịch và thưởng; không âm thầm cho client tiếp tục kiếm tài sản online.

## Những đoạn cần thay trong mã hiện tại
- `lobby.js`: `VISITORS`, `sayLobby`, `executeTrade`, `rankingRows`, `lobbySave` là nguồn offline. Tách thành adapter, giữ UI.
- `engine.js`: `S`, `save`, `addCatch`, mua/bán và nhận thưởng đang là local. Backend phải sở hữu các thao tác này.
- `cp.js`, `combat-config.json`: có thể chia sẻ công thức, nhưng server tự nạp dữ liệu thật.
- `combat.js`, `companions.js`: kết quả chỉ có giá trị offline hiện tại. Khi online, client dùng sự kiện server để hiện số sát thương và hiệu ứng.
- Không nhập toàn bộ save offline vào kinh tế online: người chơi có thể sửa localStorage hoặc dùng bản TEST. Nếu cần chuyển tiến trình, dùng quy tắc nhập hạn chế được kiểm chứng phía server.

## Kiểm thử trước khi kết nối người chơi thật
Hai người nhìn thấy cùng vị trí và boss HP; người vào muộn nhận snapshot; reconnect không nhân đôi phần thưởng; gửi lại request giao dịch không đổi lần hai; hai giao dịch tranh cùng cá chỉ một giao dịch thành công; giả CP/tiền/sát thương bị từ chối; lỗi giữa transaction không làm mất cá; đổi skin chưa sở hữu bị chặn; chat quá dài/spam bị từ chối; client bản TEST không vào dữ liệu sản xuất.

## Nguồn kỹ thuật
WebSocket cần kiểm tra xác thực, Origin, quyền theo từng tin nhắn và giới hạn tải: [OWASP WebSocket Security](https://cheatsheetseries.owasp.org/cheatsheets/WebSocket_Security_Cheat_Sheet.html).
Khóa hàng và transaction hỗ trợ xử lý giao dịch cạnh tranh; cần thứ tự khóa nhất quán và xử lý deadlock: [PostgreSQL Explicit Locking](https://www.postgresql.org/docs/current/explicit-locking.html).

## Chia sẻ bản chơi hiện tại
Trong Mable, dùng Go Live ở Studio rồi chia sẻ đường dẫn bản chơi. Đây vẫn là bản offline; việc chia sẻ không tự biến dữ liệu local thành multiplayer. Có thể dùng Get Featured để gửi bản chơi giới thiệu.
